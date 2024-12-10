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

@sock.route('/socket.io')
def socketio(sock):
    global id
    id=None
    while True:
        data=sock.receive()
        if id is None:
            id=random.randint(1,10000)
            msg = '{{"id":"{0}", "source":"ws_server", "action": "connected"}}'.format(id)
            sock.send(msg)
        else:
            msg = '{"id": id, "source": "ws_server", "action": "message", "data": "data"}'
            sock.send(
                json.dumps(msg)
            )