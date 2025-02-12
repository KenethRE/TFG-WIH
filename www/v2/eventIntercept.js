let MY_WS_ID = null;
let DEVICE_TYPE = null;
let USER_ID = null;

let socket = io();

socket.on('connect', () => {
    MY_WS_ID = socket.id;
    console.log('Connected to server with Socket ID ' + MY_WS_ID);
});
socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('registered', (data) => {
    console.log('Registered with User ID ' + data.userid);
    document.getElementById('registerDevice').classList.remove('d-none');
});

socket.on('deviceConnected', (data) => {
    console.log('Device Connected: ' + data.device);
    document.getElementById('deviceStatus').textContent = 'Device Connected: ' + data.device;
});

socket.on('eventCaptured' , (data) => {
    console.log('Event Captured: ' + data.eventType);
});



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
        source: DEVICE_TYPE
    });
}

function register_user(homeAccountId) {
    USER_ID = homeAccountId;
    document.getElementById('signIn').classList.add('d-none');
    document.getElementById('signOut').classList.remove('d-none');
    //open socket connection until user logs in
    socket.emit('register', {
        userid: homeAccountId,
        socketid: MY_WS_ID,
        source: DEVICE_TYPE
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

let buttons = document.querySelectorAll('button');
for (let i = 0; i < buttons.length; i++) {
    console.log(buttons[i].id);
    buttons[i].addEventListener('click', function() {
        socket.emit('ui_event', {
            type: 'click',
            element: this.innerText || this.id,
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
}); */

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
});

