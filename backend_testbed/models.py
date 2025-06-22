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
        user = db.select("USERS", columns=['Username', 'Email', 'Password', 'isActive'], condition='Username = "{}"'.format(username))
        if not user:
            return None, None, None, None
        write_log('User found: {}'.format(user[0]))
        # Return a tuple of Username, Email, Password, isActive
        return user[0][0], user[0][1], user[0][2], user[0][3] if user else None

    def store_user(self, user):
        write_log('store_user called with user: {}'.format(user))
        if not user.username or not user.email or not user.password:
            return False
        # Check if the user already exists
        existing_user = db.select("USERS", columns=['Username'], condition='Username = "{}"'.format(user.username))
        if existing_user:
            return False
        # Insert the new user into the database
        db.insert("USERS", {"Username": user.username, "Email": user.email, "Password": user.password, "isActive": user.is_active})
        return True
    
    def __str__(self):
        return json.dumps(self.__dict__)
    
class User(UserDAO):
    def __init__(self, username):
        self.username, self.email, self.password, self.is_active = super().get_user(username)
        self.is_authenticated = True
        self.is_anonymous = False

    def store_user(self):
        return super().store_user(self)
    
    def setis_authenticated(self, value):
        self.is_authenticated = value
        write_log('setis_authenticated called for user: {} with value: {}'.format(self.username, value))
    
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
            return None
        write_log('Device found: {}'.format(device[0]))
        return Device(user=device[0][1], type=device[0][2], status=device[0][3]) if device else None

    def store_device(self, device):
        write_log('store_device called with device: {}'.format(device))
        if not device.username or not device.deviceType:
            write_log('Invalid device data: {}'.format(device))
            return False
        # Check if the device already exists
        existing_device = db.select("DEVICES", columns=['ID'], condition='DeviceID = "{}"'.format(device.deviceid))
        if existing_device:
            write_log('Device already exists: {}'.format(device.deviceid))
            return False
        # Insert the new device into the database
        db.insert("DEVICES", {"DeviceID": device.deviceid, "Username": device.username, "DeviceType": device.deviceType})
        write_log('Device stored successfully: {}'.format(device.deviceid))
        return True
    
    def delete_device(self, device_id):
        write_log('delete_device called with device_id: {}'.format(device_id))
        db.delete("DEVICES", condition='DeviceID = "{}"'.format(device_id))
        write_log('Device deleted successfully: {}'.format(device_id))
        return True
    
    def __str__(self):
        return json.dumps(self.__dict__)

class Device(DeviceDAO):
    def __init__(self, deviceid, username, deviceType, status='offline'):
        self.deviceid = deviceid
        self.username = username
        self.deviceType = deviceType
        self.status = status

    def store_device(self):
        return super().store_device(self)

    def __str__(self):
        return json.dumps(self.__dict__)
    
    def toggle_status(self):
        self.status = 'online' if self.status == 'offline' else 'offline'
        write_log('Device {} status changed to {}'.format(self.deviceid, self.status))

