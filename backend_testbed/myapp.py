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
    emit('registered', {"userid": userid}, to=userid)

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
    emit('deviceConnected', {'deviceid':deviceid}, to=msg['userid'])

@socketio.on('connection')
def connection(data):
    write_log('connection')
    write_log(str(data))
    if data['source']=='computer':
        device = 'computer'
        #emit('connection',{'id':id})
    elif data['source']=='mobile':
        None
        #emit('connected',{'id':id})

@socketio.on('disconnect')
def disconnect():
    write_log('disconnected')

@socketio.on('message')
def message(data):
    write_log(str(data))
    emit('message',data, to=data['userid'])