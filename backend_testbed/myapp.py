from flask import Flask,render_template,request
from flask_socketio import SocketIO, emit
import subprocess
from werkzeug.middleware.proxy_fix import ProxyFix
from enum import Enum
import random, json


app = Flask(__name__)
socketio = SocketIO(app,debug=True,cors_allowed_origins='*',async_mode='eventlet')
app.wsgi_app = ProxyFix(app.wsgi_app,x_for=1, x_proto=1, x_host=1, x_prefix=1)
id = None
device = None

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

@socketio.on('connect')
def connect():
    write_log('connected')
    #generate a global id and store it
    #id=random.randint(1000,9999)

@socketio.on('connection')
def connection(data):
    global id
    global device
    write_log('connection')
    write_log(str(data))
    if data['source']=='computer':
        device = 'computer'
        emit('connection',{'id':id})
    elif data['source']=='mobile': 
        device = 'mobile'
        id = 1717   
        emit('connected',{'id':id})

@socketio.on('disconnect')
def disconnect():
    global device
    write_log('disconnected ' + device)
    if device == 'mobile':
        global id
        id = None
        emit('close', {'id':id})

@socketio.on('message')
def message(data):
    #if data['source']=='mouse':
    #    write_log(str(data))
    global id
    data['id']=id
    write_log(str(data))
    emit('message',data)