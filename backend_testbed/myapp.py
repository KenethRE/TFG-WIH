from flask import Flask, render_template, request
from flask_socketio import SocketIO, join_room, leave_room, emit
import subprocess
from werkzeug.middleware.proxy_fix import ProxyFix
from enum import Enum
import random, json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
id = None

def write_log(data):
    with open('log.txt', 'a') as f:
        f.write(data + '\n')

@app.route('/')
def index():
    return 'SocketIO Server'

@socketio.on('connect')
def handle_connect():
    global id
    id = random.randint(1000, 9999)
    write_log('connected')

    # Access query parameters
    source = request.args.get('source')

    write_log('connection')
    write_log(f'source: {source}')

    if source == 'computer':
        emit('connected', {'id': id})
    elif source == 'mobile':
        socketio.emit('connection', {'id': id})

@socketio.on('register')
def handle_register(data):
    device_id = data.get('deviceId')
    room = data.get('room')
    join_room(room)
    print(f'Device {device_id} joined room {room}')
    emit('registered', {'deviceId': device_id, 'room': room}, room=room)

@socketio.on('disconnect')
def disconnect():
    global device
    write_log('disconnected ' + device)
    if device == 'mobile':
        emit('close', {'id': id})

@socketio.on('message')
def handle_message(msg):
    room = msg.get('room')
    print('Received message:', msg)
    emit('message', msg, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)