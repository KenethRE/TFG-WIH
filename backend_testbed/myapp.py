from flask import Flask,render_template,request
from flask_socketio import SocketIO, emit
import subprocess
from werkzeug.middleware.proxy_fix import ProxyFix
from enum import Enum

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app,x_for=1, x_proto=1, x_host=1, x_prefix=1)
socketio = SocketIO(app,debug=True,cors_allowed_origins='*',async_mode='eventlet')

class Events(Enum):
    PING = 1
    TRACEROUTE = 2
    DNSLOOKUP = 3
    WHOIS = 4
    PORTSCAN = 5
    NMAP = 6
    NETCAT = 7
    NETSTAT = 8

def write_log(data):
    with open('log.txt','a') as f:
        f.write(data+'\n')


@app.route('/home')
def main():
        write_log(request.headers.get('X-Real-IP'))
        return render_template('base.html')

# Print contents of message received on the websocket
@socketio.on('my event')
def handle_my_custom_event(json):
    write_log('received json: ' + str(json) + ' from ' + request.sid + '\n')

@socketio.on("my_event")
def checkping():
    for x in range(5):
        cmd = 'ping -c 1 8.8.8.8|head -2|tail -1'
        listing1 = subprocess.run(cmd,stdout=subprocess.PIPE,text=True,shell=True)
        sid = request.sid
        emit('server', {"data1":x, "data":listing1.stdout}, room=sid)
        socketio.sleep(1)