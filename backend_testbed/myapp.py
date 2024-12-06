from flask import Flask,render_template,request
from flask_socketio import SocketIO, emit
import subprocess

app = Flask(__name__)
socketio = SocketIO(app,debug=True,cors_allowed_origins='*',async_mode='eventlet')


@app.route('/home')
def main():
        return render_template('base.html')

@socketio.on("my_event")
def checkping():
    for x in range(5):
        cmd = 'ping -c 1 8.8.8.8|head -2|tail -1'
        listing1 = subprocess.run(cmd,stdout=subprocess.PIPE,text=True,shell=True)
        sid = request.sid
        emit('server', {"data1":x, "data":listing1.stdout}, room=sid)
        socketio.sleep(1)