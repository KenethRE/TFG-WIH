from flask import Flask,render_template,request
from flask_socketio import SocketIO, emit
import subprocess
from werkzeug.middleware.proxy_fix import ProxyFix
from enum import Enum
import random, json


app = Flask(__name__)
socketio = SocketIO(app,debug=True,cors_allowed_origins='*',async_mode='eventlet')
app.wsgi_app = ProxyFix(app.wsgi_app,x_for=1, x_proto=1, x_host=1, x_prefix=1)

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
    #generate a global id and store it
    global id
    #id=random.randint(1000,9999)
    id=1717

@socketio.on('connection')
def connection(data):
    write_log(str(data))
    if data['source']=='mobile':
        emit('message',{'id':id,'source':'ws_server','action':'connection','data':''}, room=id)
    else:    
        emit('message',{'id':id,'source':'ws_server','action':'connected','data':''}, room=id)


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