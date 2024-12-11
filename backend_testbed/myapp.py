from flask import Flask,render_template,request
from flask_sock import Sock
import subprocess
from werkzeug.middleware.proxy_fix import ProxyFix
from enum import Enum
import random, json


app = Flask(__name__)
sock=Sock(app)
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

@sock.route('/socket.io')
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