from logwriter import write_log
import json, random
import database
db = database.check_database()

class WebsiteDAO():
    def __init__(self):
        pass
    
    def get_website(self, URL):
        write_log('get_website called with URL: {}'.format(URL))
        website = db.select("WEBSITES", columns=['WebsiteID', 'Name', 'URL'], condition='URL = "{}"'.format(URL))
        if not website:
            return None
        write_log('Website found: {}'.format(website[0][1]))
        return Website(id=website[0][0], name=website[0][1], url=website[0][2]) if website else None

    def store_website(self, website):
        write_log('store_website called with website: {}'.format(website))
        if not website.name or not website.url:
            return False
        # Check if the website already exists
        existing_website = db.select("WEBSITES", columns=['WebsiteID'], condition='Name = "{}" AND URL = "{}"'.format(website.name, website.url))
        if existing_website:
            return False
        # Insert the new website into the database
        db.insert("WEBSITES", {"Name": website.name, "URL": website.url})
        return True
    
    def get_website_elements(self, website_id):
        write_log('get_website_elements called with website_id: {}'.format(website_id))
        elements = db.select("ELEMENTS", columns=['ElementID', 'WebsiteID', 'Name', 'Type', 'HTML'], condition='WebsiteID = {}'.format(website_id))
        if not elements:
            return None
        write_log('Elements found for website_id {}: {}'.format(website_id, elements))
        return [Element(id=elem[0], website_id=elem[1], name=elem[2], type=elem[3], html=elem[4]) for elem in elements] if elements else None
    
    def __str__(self):
        return json.dumps(self.__dict__)
    
class Website(WebsiteDAO):
    def __init__(self, id=None, name=None, url=None):
        self.id = id
        self.name = name
        self.url = url
    def set_elements(self, elements):
        self.elements = elements
    def __str__(self):
        return json.dumps(self.__dict__)

class Element():
    def __init__(self, id=None, website_id=None, html=None, type=None, name=None):
        self.id = id
        self.name = name
        self.website_id = website_id
        self.html = html
        self.type = type

    def __str__(self):
        return json.dumps(self.__dict__)

class ElementDAO():
    def __init__(self):
        pass
    
    def get_element(self, element_id):
        write_log('get_element called with element_id: {}'.format(element_id))
        element = db.select("ELEMENTS", columns=['ElementID', 'WebsiteID', 'Name', 'Type', 'HTML'], condition='ElementID = {}'.format(element_id))
        if not element:
            return None
        write_log('Element found: {}'.format(element[0]))
        return Element(id=element[0][0], website_id=element[0][1], name=element[0][2], type=element[0][3], html=element[0][4]) if element else None

    def store_element(self, element):
        write_log('store_element called with element: {}'.format(element))
        if not element.name or not element.type or not element.website_id:
            return False
        # Check if the element already exists
        existing_element = db.select("ELEMENTS", columns=['ElementID'], condition='Name = "{}" AND Type = "{}" AND WebsiteID = {}'.format(element.name, element.type, element.website_id))
        if existing_element:
            return False
        # Insert the new element into the database
        db.insert("ELEMENTS", {"ElementID": element.id, "WebsiteID": element.website_id, "Name": element.name, "Type": element.type, "HTML": element.html})
        return True
    
    def __str__(self):
        return json.dumps(self.__dict__)
    
class UserDAO():
    def __init__(self):
        pass
    def get_user(self, username):
        user = db.select("USERS", columns=['Username', 'Email', 'Password', 'isActive'], condition='Username = "{}"'.format(username))
        if not user:
            return None
        write_log('User found: {}'.format(user[0][0]))
        # Return a tuple of Username, Email, Password, isActive
        return User(username=user[0][0], email=user[0][1], password=user[0][2], is_active=user[0][3])

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
    def __init__(self, username=None, email=None, password=None, is_active=1):
        self.username = username
        self.email = email
        self.password = password
        self.is_active = is_active
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
        existing_device = db.select("DEVICES", columns=['DeviceID'], condition='DeviceID = "{}"'.format(device.deviceid))
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

class EventDAO():
    def __init__(self):
        pass
    
    def store_event(self, event):
        write_log('store_event called with event: {}'.format(event))
        if not event.deviceid or not event.event_type or not event.timestamp:
            return False
        # Insert the new event into the database
        db.insert("EVENTS", {"DeviceID": event.deviceid, "EventType": event.event_type, "ElementID": event.element_id, "Timestamp": event.timestamp})
        write_log('Event stored successfully: {}'.format(event))
        return True

    def get_events(self, event):   
        write_log('get_events called')
        events = db.select("EVENTS", columns=['DeviceID', 'EventType', 'ElementID', 'Timestamp'] , condition='DeviceID = "{}"'.format(event.deviceid) if event.deviceid else None)
        if not events:
            return None
        write_log('Events found: {}'.format(events))
        return [Event(deviceid=event[0], event_type=event[1], element_id=event[2], timestamp=event[3]) for event in events] if events else None

    def delete_event(self, event):
        write_log('delete_event called with DeviceID: {}'.format(event.deviceid))
        db.delete("EVENTS", condition='DeviceID = "{}"'.format(event.deviceid))
        write_log('Event deleted successfully: {}'.format(event.deviceid))
        return True

class Event(EventDAO):
    def __init__(self, deviceid, event_type, element_id, timestamp):
        self.deviceid = deviceid
        self.event_type = event_type
        self.element_id = element_id
        self.timestamp = timestamp

    def store_event(self):
        return super().store_event(self)

    def __str__(self):
        return json.dumps(self.__dict__)

