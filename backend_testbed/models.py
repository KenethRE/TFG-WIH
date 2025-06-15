from logwriter import write_log
import json, random, database
db = database.check_database()
class Msg():
    def __init__(self, id, source, action, data):
        self.id=id
        self.source=source
        self.action=action
        self.data=data
    
    def __str__(self):
        return json.dumps(self.__dict__)

class Website():
    def __init__(self, id, name, url):
        self.id = id
        self.name = name
        self.url = url
        self.elements = []
        # This elements needs to contain the actual ID used on the website, if no ID is available on the website, use a random ID
        # For testing purposes, we will add a dummy element
        self.elements.append({"id": 1, "name": "Element 1", "type": "button"})
    def __str__(self):
        return json.dumps(self.__dict__)

class UserDAO():
    def __init__(self):
        pass
    def get_user(self, username):
        write_log('get_user called with username: {}'.format(username))
        user = db.select("USERS", columns=['Username', 'Email', 'Password', 'isActive'], condition='Username = "{}"'.format(username))
        if not user:
            write_log('User not found: {}'.format(username))
            return None
        write_log('User found: {}'.format(user[0]))
        # Return a tuple of Username, Email, Password, isActive
        return User(username=user[0][0], email=user[0][1], password=user[0][2], is_active=user[0][3]) if user else None

    def store_user(self, user):
        write_log('store_user called with user: {}'.format(user))
        if not user.username or not user.email or not user.password:
            write_log('Invalid user data: {}'.format(user))
            return False
        # Check if the user already exists
        existing_user = db.select("USERS", columns=['Username'], condition='Username = "{}"'.format(user.username))
        if existing_user:
            write_log('User already exists: {}'.format(user.username))
            return False
        # Insert the new user into the database
        db.insert("USERS", {"Username": user.username, "Email": user.email, "Password": user.password, "isActive": user.is_active})
        write_log('User stored successfully: {}'.format(user.username))
        return True
    
    def __str__(self):
        return json.dumps(self.__dict__)
    
class User(UserDAO):
    def __init__(self, username=None, email=None, password=None, is_active=0):
        self.username = username
        self.email = email
        self.password = password
        self.is_authenticated = False
        self.is_anonymous = False
        self.is_active = is_active

    def store_user(self):
        return super().store_user(self)
    
    def get_id(self):
        write_log('get_id called for user: {}'.format(self.username))
        return self.username

class DeviceDAO():
    def __init__(self):
        pass
    
    def get_device(self, device_id):
        write_log('get_device called with device_id: {}'.format(device_id))
        device = db.select("DEVICES", columns=['DeviceID', 'Username', 'DeviceType'], condition='ID = {}'.format(device_id))
        if not device:
            write_log('Device not found: {}'.format(device_id))
            return None
        write_log('Device found: {}'.format(device[0]))
        return Device(user=device[0][1], type=device[0][2], status=device[0][3]) if device else None

    def store_device(self, device):
        write_log('store_device called with device: {}'.format(device))
        if not device.user or not device.type:
            write_log('Invalid device data: {}'.format(device))
            return False
        # Check if the device already exists
        existing_device = db.select("DEVICES", columns=['ID'], condition='DeviceID = "{}"'.format(device.id))
        if existing_device:
            write_log('Device already exists: {}'.format(device.id))
            return False
        # Insert the new device into the database
        db.insert("DEVICES", {"DeviceID": device.id, "Username": device.user, "DeviceType": device.type})
        write_log('Device stored successfully: {}'.format(device.id))
        return True
    
    def __str__(self):
        return json.dumps(self.__dict__)

class Device(DeviceDAO):
    def __init__(self, deviceid, user, type, status='offline'):
        self.deviceid = deviceid
        self.user = user
        self.type = type
        self.status = status

    def __str__(self):
        return json.dumps(self.__dict__)
    
    def toggle_status(self):
        self.status = 'online' if self.status == 'offline' else 'offline'
        write_log('Device {} status changed to {}'.format(self.deviceid, self.status))

