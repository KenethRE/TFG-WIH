let MY_WS_ID = null;
let DEVICE_TYPE = null;
let USER_ID = null;

const socket = io();

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

function registerDevice() {
    socket.emit('startDevice', {
        socketid: MY_WS_ID,
        source: DEVICE_TYPE
    });
}

function register_user(homeAccountId) {
    USER_ID = homeAccountId;
    socket.emit('register', {
        userid: homeAccountId,
        socketid: MY_WS_ID,
        source: DEVICE_TYPE
    });
}

function interceptEvent(element, eventType) {
    const originalHandler = element[`on${eventType}`]; // Save existing handler if any

    element[`on${eventType}`] = function(event) {
        // Send event data via Socket.IO
        socket.emit("eventCaptured", {
            userid: USER_ID,
            eventType: eventType,
            target: event.target.tagName,
            timestamp: event.timeStamp,
            details: {
                clientX: event.clientX,
                clientY: event.clientY
            }
        });

        // Execute the original event handler if it exists
        if (originalHandler) {
            return originalHandler.call(this, event);
        }
    };
}

// Example usage: intercept click events on a button
const button = document.querySelector("#myButton");
interceptEvent(button, "click");
