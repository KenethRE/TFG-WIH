from flask import Flask,render_template,request
from flask_sock import Sock
import subprocess
from werkzeug.middleware.proxy_fix import ProxyFix
from enum import Enum

app = Flask(__name__)
sock=Sock(app)
app.wsgi_app = ProxyFix(app.wsgi_app,x_for=1, x_proto=1, x_host=1, x_prefix=1)

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

@sock.route('/socket.io')
def socketio(sock):
    while True:
        data=sock.receive()
        write_log(data)
        write_log('\n')
