from flask import Flask,render_template,request
from flask_socketio import SocketIO, emit, join_room, leave_room
import subprocess
from werkzeug.middleware.proxy_fix import ProxyFix
from enum import Enum
import random, json, time
from sqlite4 import SQLite4

app = Flask(__name__)
socketio = SocketIO(app,debug=True,cors_allowed_origins='*',async_mode='eventlet')
app.wsgi_app = ProxyFix(app.wsgi_app,x_for=1, x_proto=1, x_host=1, x_prefix=1)
db = SQLite4("app.db")
# create users table
db.connect()
db.create_table("USERS", ["UserID", "SocketID", "deviceType","timestamp"])

def write_log(data):
    with open('log.txt','a') as f:
        f.write(data+'\n')

class Msg():
    def __init__(self, id, source, action, data):
        self.id=id
        self.source=source
        self.action=action
        self.data=data
    
    def __str__(self):
        return json.dumps(self.__dict__)

@socketio.on('register')
def register(data):
    write_log('register event')
    # get current userlist  
    userid = data['userid']
    socketid = data['socketid']
    # check if user and socket already exists
    #socketList = db.select("USERS", columns=['UserID', 'SocketID'], condition='UserID = {}'.format(userid))
    db.insert("USERS", {"UserID": userid, "SocketID": data['socketid'], "deviceType": data['source'], "timestamp": time.time()})
    join_room(userid, sid=socketid)
    event_list = eventList()
    emit('registered', {"userid": userid, "event_list": event_list}, to=userid)

def eventList():
    with open('event_definition.json') as f:
        return json.load(f)

@socketio.on('unregister')
def unregister(data):
    write_log('unregister event')
    userid = data['userid']
    socketid = data['socketid']
    db.delete("USERS", condition='UserID = {}'.format(userid))
    leave_room(userid, sid=socketid)
    emit('unregistered', {"userid": userid})

@socketio.on('startDevice')
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