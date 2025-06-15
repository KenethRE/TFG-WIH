let MY_WS_ID = null;
let MY_WS_ID_LOGIN = null;
let DEVICE_TYPE = null;
let USER_ID = null;

let socket;

function socketSetup() {
    const socket = io();

    socket.on('login_success', (data) => {
        console.log('Login successful for User ID ' + data.username);
        USER_ID = data.username;

        welcomeUser(data.username);
        document.getElementById('signIn').classList.add('d-none');
        document.getElementById('signOut').classList.remove('d-none');
        socket.emit('registerDevice', {
            username: USER_ID,
            socketid: MY_WS_ID,
            deviceType: DEVICE_TYPE
        });
    });

    socket.on('registration_error', (data) => {
        console.error('Registration error: ' + data.message);
    });

    socket.on('unauthenticated', () => {
        console.log('User not authenticated');
    });

    socket.on('connect', () => {
        MY_WS_ID = socket.id;
        console.log('Connected to server with Socket ID ' + MY_WS_ID);
    });


    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    socket.on('registered', (data) => {
        console.log('Registered device ' + DEVICE_TYPE + ' with User ID ' + data.username);
        captureEvents(data.event_list);
    });

    socket.on('deviceConnected', (data) => {
        deviceInfo = JSON.stringify(data.device, null, 2);
        console.log('Device Connected: ' + deviceInfo);
        document.getElementById('deviceStatus').appendChild(document.createTextNode(deviceInfo));
        document.getElementById('deviceStatus').classList.remove('d-none');
    });

    socket.on('eventCaptured' , (data) => {
        console.log('Event Captured: ' + data.eventType);
    });

    socket.on('ui_event', (data) => {
        console.log('UI Event: ' + JSON.stringify(data));
        if (data.type === 'click') {
            let buttonFunc = document.getElementById(data.element).onclick;
            if (buttonFunc) {
                buttonFunc();
            }
        }
    });
}

socketSetup();

function getDeviceType() {
    if (window.innerWidth < 768) {
        DEVICE_TYPE = 'mobile';
    } else if (window.innerWidth < 992) {
        DEVICE_TYPE = 'tablet';
    } else {
        DEVICE_TYPE = 'desktop';
    }
}
getDeviceType();


// Hide the button on desktop
if (DEVICE_TYPE === 'desktop') {
    document.getElementById('myButton').classList.add('d-none');
} else {
    document.getElementById('myButton').classList.remove('d-none');
}

function registerDevice() {
    socket.emit('startDevice', {
        socketid: MY_WS_ID,
        source: DEVICE_TYPE,
        userid: USER_ID
    });
}

function welcomeUser(username) {
    document.getElementById('welcome-div').classList.remove('d-none');
    document.getElementById('welcome-div').textContent = 'Welcome ' + username;
}

function printText() {
    console.log('Print Text');
    document.getElementById('myText').textContent = 'Hello World';
    document.getElementById('myText').classList.remove('d-none');
}

// Capture all click events on buttons

function captureEvents(event_list) {
    for (let i = 0; i < event_list.length; i++) {
        let event_json = event_list[i];
        if (event_json.eventType === 'click') {
            let buttons = document.querySelectorAll('button');
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].addEventListener('click', function() {
                    socket.emit('ui_event', {
                        type: 'click',
                        element: this.id,
                        userid: USER_ID,
                        timestamp: Date.now()
                    });
                });
            }
        } else {
            document.addEventListener(event_json.eventType, (event) => {
                socket.emit("ui_event", {
                    type: event_json.eventType,
                    userid: USER_ID,
                    timestamp: Date.now()
                });
            });
        }
    }

/*     let buttons = document.querySelectorAll('button');
    for (let i = 0; i < buttons.length; i++) {
        console.log(buttons[i].id);
        buttons[i].addEventListener('click', function() {
            socket.emit('ui_event', {
                type: 'click',
                element: this.id,
                userid: USER_ID,
                timestamp: Date.now()
            });
        });
    }
    
    /* document.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON") {
            socket.emit("ui_event", {
                type: "click",
                element: event.target.innerText || event.target.id,
                userid: USER_ID,
                timestamp: Date.now()
            });
        }
    });
    
    // Capture all input field changes
    document.addEventListener("input", (event) => {
        if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
            socket.emit("ui_event", {
                type: "input",
                element: event.target.name || event.target.id,
                userid: USER_ID,
                value: event.target.value,
                timestamp: Date.now()
            });
        }
    });
    
    // Capture keypresses
    document.addEventListener("keydown", (event) => {
        socket.emit("ui_event", {
            type: "keydown",
            userid: USER_ID,
            key: event.key,
            timestamp: Date.now()
        });
    }); */
}
