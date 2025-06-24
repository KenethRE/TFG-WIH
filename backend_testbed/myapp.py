from flask import Flask,render_template,request, flash
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, Website, WebsiteDAO, UserDAO, Device, DeviceDAO, ElementDAO
import json
from logwriter import write_log
import encryption as encryption

app = Flask(__name__)
socketio = SocketIO(app,debug=False,cors_allowed_origins='*',async_mode='eventlet')
login_manager = LoginManager()
login_manager.init_app(app)
app.wsgi_app = ProxyFix(app.wsgi_app,x_for=1, x_proto=1, x_host=1, x_prefix=1)
app.config['SECRET_KEY'] = encryption.get_secrets()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(username):
    write_log('load_user called with user_id: {}'.format(username))
    return UserDAO().get_user(username)

@app.route('/login', methods=['GET', 'POST'])
def login():
    write_log('login request')
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        user = UserDAO().get_user(username)
        if user is None:
            write_log('Login failed for user {}'.format(username))
            flash('Username does not exist. Please try again or sign up below.')
            return render_template('login.html')
        if user.username and check_password_hash(user.password, password):
            if (login_user(user, remember=remember)):
                write_log('User Data: {}'.format(user.__str__()))
                socketio.emit('login_success', {'username': username})
                return render_template('login_success.html', username=username, message="Login successful")
        else:
            write_log('Login failed for user {}'.format(username))
            flash('Please check your login details and try again.')
            return render_template('login.html')
    return render_template('login.html')

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    write_log('logout request')
    if current_user.is_authenticated:
        write_log('User {} logged out successfully'.format(current_user))
        logout_user()
    else:
        write_log('Logout request received but no user is authenticated')
    # Here you would typically handle the logout logic, such as clearing the session
    return render_template('login.html', message="You have been logged out successfully.")

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    write_log('signup request')
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        hashed_password = generate_password_hash(password)
        # if email is not None:
        if not username or not password:
            flash('Username and password is required.')
            return render_template('signup.html')
        if not email:
            email = username + '@example.com'  # Default email if not provided
        user = User(username=username, email=email, password=hashed_password, is_active=1)
        if user.store_user():
            write_log('User {} created successfully'.format(username))
            flash('User created successfully - please login')
            return render_template('login.html', message="User created successfully - please login")
        else:
            write_log('Signup failed for user {}'.format(username))
            flash('User already exists. Please choose a different username.')
            return render_template('signup.html')
    return render_template('signup.html')

@socketio.on('connect')
def connect():
    write_log('client connected')
    # Print entire request object for debugging
    website_name = request.headers.get('Referer', '').split('/')[2] if request.headers.get('Referer') else None
    url = request.headers.get('Referer', '').split('/')[0] + '//' + website_name
    website = Website().get_website(url)
    if not website:
        write_log('Website {} does not exist, creating it'.format(website_name))
        new_website = Website(id=None, name=website_name, url=url)
        if new_website.store_website(new_website):
            write_log('Website {} created successfully'.format(website_name))
            new_website = Website().get_website(url)
            # check if website has been processed already
            try:
                elements_file = './custom_elements/{}_elements.json'.format(website_name)
                with open(elements_file, 'r') as f:
                    elements = json.load(f)
                write_log('Found {} elements in file {}'.format(len(elements), elements_file))
            except FileNotFoundError:
                write_log('No elements found for website {}'.format(website_name))
            emit('elements', {'elements': elements, 'website': new_website.id})
        else:
            write_log('Failed to create website {}'.format(website_name))
    else:
        write_log('Website {} already exists'.format(website_name))
        # Grab elements from file
        try:
            elements_file = './custom_elements/{}_elements.json'.format(website_name)
            with open(elements_file, 'r') as f:
                elements = json.load(f)
            write_log('Found {} elements in file {}'.format(len(elements), elements_file))
        except FileNotFoundError:
            write_log('No elements file found for website {}'.format(website_name))
        emit('elements', {'elements': elements, 'website': website.id})
    if current_user.is_authenticated:
        write_log('User {} connected'.format(current_user.username))
        join_room(current_user.username)
        emit('login_success', {'username': current_user.username}, to=current_user.username)
    else:
        write_log('Unauthenticated user connected')
        emit('unauthenticated', {'message': 'Please login to continue'})

@socketio.on('disconnect')
def disconnect():
    # Grab current SID and delete it from the database
    socketid = request.sid
    write_log('Socket ID {} disconnected'.format(socketid))
    if (DeviceDAO().delete_device(socketid)):
        write_log('Device with socket ID {} unregistered successfully'.format(socketid))
        emit('unregister', {'message': 'Device unregistered successfully', 'socketid': socketid}, broadcast=True)
    else:
        write_log('Failed to unregister device with socket ID {}'.format(socketid))
    write_log('Device with socket ID {} unregistered'.format(socketid))
    emit('disconnected', {'message': 'You have been disconnected', 'socketid': socketid}, to=socketid)
    if current_user.is_authenticated:
        write_log('User {} disconnected'.format(current_user.username))
    else:
        write_log('Unauthenticated user disconnected')

@socketio.on('registerDevice')
def register(data):
    write_log('Registering device with data: {}'.format(data)) 
    username = data['username']
    socketid = data['socketid']
    deviceType = data['deviceType']
    website_id = data['website_id']
    write_log('Registering device for user: {}, socketid: {}, deviceType: {} and website_id: {}'.format(username, socketid, deviceType, website_id))
    if not username or not socketid or not deviceType:
        write_log('Invalid registration data: {}'.format(data))
        emit('registration_error', {'message': 'Invalid registration data'}, to=username)
        return
    if deviceType not in ['desktop', 'mobile', 'tablet']:
        write_log('Invalid device type: {}'.format(deviceType))
        emit('registration_error', {'message': 'Invalid device type'}, to=username)
        return
    device = Device(deviceid=socketid, username=username, deviceType=deviceType)
    if not device.store_device():
        write_log('Device registration failed for user: {}'.format(username))
        emit('registration_error', {'message': 'Device registration failed'}, to=username)
        return
    device.toggle_status()
    write_log('Device registered successfully for user: {}'.format(username))
    join_room(username, sid=socketid)
    deviceinfo = {
        "deviceid": device.deviceid,
        "username": device.username,
        "deviceType": device.deviceType,
        "status": device.status
    }
    emit('registered', {"username": username, "deviceinfo": deviceinfo}, to=username)


@socketio.on('unregister')
def unregister(data):
    write_log('unregister event')
    username = data['username']
    socketid = data['socketid']
    #db.delete("USERS", condition='UserID = {}'.format(userid))
    leave_room(username, sid=socketid)
    emit('unregistered', {"username": username})

@socketio.on('ui_event')
def ui_event(data):
    write_log('ui_event of type: '+data['type'] + ' for user: ' + data['username'])
    # add identifier to event to recognize that is being sent from the server and not generated by the client
    data['server_event'] = True
    if 'username' not in data or not data['username']:
        write_log('ui_event received without username')
        return
    emit('ui_event',data, to=data['username'])

@socketio.on('file')
def file(data):
    write_log('file event')
    emit('file',data, to=data['username'])

@socketio.on('message')
def message(data):
    write_log(str(data))
    emit('message',data, to=data['username'])

@socketio.on('eventCaptured')
def eventCaptured(data):
    write_log('new event was captured')
    emit('eventCaptured', to=data['username'])