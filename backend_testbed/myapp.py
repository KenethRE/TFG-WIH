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
    write_log(str(data))
    if data['source']=='computer' and id is not None:
        emit('message',{'id':id,'source':'ws_server','action':'connection','data':''})
    else: 
        id = 1717   
        emit('message',{'id':id,'source':'ws_server','action':'connected','data':''})

@socketio.on('message')
def message(data):
    if data['source']=='mouse':
        write_log(str(data))
    emit('message',data)

def socketio(sock):
    global id
    id=None
    while True:
        data=sock.receive()
        id=1717
        data=json.loads(data)
        if 'id' in data:
            data['id']=id
            write_log(str(data))
            sock.send(json.dumps(data))
        else:
            data['id']=str(id)
            if data['source']=='mobile':
                data['action']='connected'
                data['source']='ws_server'
            elif data['source']=='mouse':
                write_log(str(data))
            elif data['source']=='computer':
                data['action']='connection'
                data['source']='ws_server'
            sock.send(json.dumps(data))