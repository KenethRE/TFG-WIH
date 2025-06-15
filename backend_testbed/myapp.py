from flask import Flask,render_template,request, flash
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, Msg, Website, UserDAO
import random, json, time
from logwriter import write_log
import encryption as encryption

app = Flask(__name__)
socketio = SocketIO(app,debug=True,cors_allowed_origins='*',async_mode='eventlet')
login_manager = LoginManager()
login_manager.init_app(app)
app.wsgi_app = ProxyFix(app.wsgi_app,x_for=1, x_proto=1, x_host=1, x_prefix=1)
app.config['SECRET_KEY'] = encryption.get_secrets()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(username):
    write_log('load_user called with user_id: {}'.format(username))
    user = User().get_user(username)
    if user.username:
        write_log('User loaded: {}'.format(user.username))
        return user
    else:
        write_log('User not found: {}'.format(username))
        return None

@app.route('/login', methods=['GET', 'POST'])
def login():
    write_log('login request')
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        user = User().get_user(username)
        if user is None:
            write_log('Login failed for user {}'.format(username))
            flash('Username does not exist. Please try again or signup.')
            return render_template('login.html')
        if user.username and check_password_hash(user.password, password):
            write_log('User {} logged in successfully'.format(username))
            login_user(user, remember=remember)
            socketio.emit('login_success', {'username': username}, to=user.username, namespace='/login')
            return render_template('login_success.html', username=username, message="Login successful")
        else:
            write_log('Login failed for user {}'.format(username))
            flash('Please check your login details and try again.')
            return render_template('login.html')
    return render_template('login.html')

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    write_log('logout request')
    if current_user.is_authenticated:
        logout_user()
        write_log('User {} logged out successfully'.format(current_user.username))
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


@socketio.on('register')
@login_required
def register(data):
    write_log('register event')
    # get current userlist  
    userid = data['userid']
    socketid = data['socketid']
    # check if user and socket already exists
    #socketList = db.select("USERS", columns=['UserID', 'SocketID'], condition='UserID = {}'.format(userid))
    join_room(userid, sid=socketid)
    event_list = eventList()
    emit('registered', {"userid": userid, "event_list": event_list}, to=userid)

def eventList():
    with open('event_definitions.json') as f:
        return json.load(f)

@socketio.on('unregister')
@login_required
def unregister(data):
    write_log('unregister event')
    userid = data['userid']
    socketid = data['socketid']
    #db.delete("USERS", condition='UserID = {}'.format(userid))
    leave_room(userid, sid=socketid)
    emit('unregistered', {"userid": userid})

@socketio.on('startDevice')
@login_required
def connect(msg):
    write_log('connected device of type: '+msg['source'])
    #generate a random device id
    deviceid=random.randint(1000,9999)
    userid = msg['userid']
    msg = {
        'deviceid': deviceid,
        'device': {
            'deviceid': deviceid,
            'deviceType': msg['source']
        }
    }
    emit('deviceConnected', msg, to=userid)

@socketio.on('ui_event')
def ui_event(data):
    write_log('ui_event of type: '+data['type'])
    emit('ui_event',data, to=data['userid'])

@socketio.on('disconnect')
def disconnect():
    write_log('disconnected')

@socketio.on('file')
def file(data):
    write_log('file event')
    emit('file',data, to=data['userid'])

@socketio.on('message')
def message(data):
    write_log(str(data))
    emit('message',data, to=data['userid'])

@socketio.on('eventCaptured')
def eventCaptured(data):
    write_log('new event was captured')
    emit('eventCaptured', to=data.userid)