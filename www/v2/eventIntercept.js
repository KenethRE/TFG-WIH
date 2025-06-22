let MY_WS_ID = null;
let MY_WS_ID_LOGIN = null;
let DEVICE_TYPE = null;
let USER_ID = null;

let socket;

function socketSetup() {
    socket = io();

    socket.on('login_success', (data) => {
        console.log('Login successful for User ID ' + data.username);
        USER_ID = data.username;
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
        console.log('Device Connected: ' + JSON.stringify(data.deviceinfo));
        login_text = document.getElementById('floating-login');
        //add collapse button to the floating login text
        let collapseButton = document.createElement('button');
        collapseButton.classList.add('btn', 'btn-secondary', 'mb-2');
        collapseButton.textContent = 'Hide Device Info';
        collapseButton.onclick = function() {
            let loginText = document.getElementById('floating-login');
            if (loginText.classList.contains('d-none')) {
                loginText.classList.remove('d-none');
            } else {
                loginText.childNodes.forEach(child => {
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        child.classList.add('d-none');
                    }
                });
                // add a button to expand the login text
                let expandButton = document.createElement('button');
                expandButton.classList.add('btn', 'btn-secondary', 'mt-2');
                expandButton.textContent = 'Show Device Info';
                expandButton.onclick = function() {
                    loginText.childNodes.forEach(child => {
                        if (child.nodeType === Node.ELEMENT_NODE) {
                            child.classList.remove('d-none');
                        }
                    });
                    loginText.classList.remove('d-none');
                    // Remove the expand button after clicking
                    this.remove();
                };
                loginText.appendChild(expandButton);
            }
        };
        // Append the collapse button to the floating login text
        login_text.appendChild(collapseButton);

        // Show welcome message
        login_Text.appendChild(document.createElement('span')).textContent = 'Welcome ' + data.username + '!';

        //Create a table to show device id and logout button
        let table = document.createElement('div');
        table.classList.add('container');
        table.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h5>Device Information</h5>
                    <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <td>Device ID</td>
                                <td>${data.deviceinfo.deviceid}</td>
                            </tr>
                            <tr>
                                <td>Device Type</td>
                                <td>${DEVICE_TYPE}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
        login_text.appendChild(table);
        // Add logout button (directs to logout endpoint)
        let logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.classList.add('btn', 'btn-danger', 'mt-2');
        logoutButton.onclick = function() {
            fetch('https://tfg.zenken.es/logout', {
                method: 'POST',
                credentials: 'include'
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = window.location.href; // Redirect to current page or home page
                } else {
                    console.error('Logout failed');
                }
            })
            .catch(error => console.error('Error:', error));
        };
        // Append the logout button to the floating login text
        login_text.appendChild(logoutButton);
        login_text.classList.remove('d-none');
    });

    socket.on('deviceConnected', (data) => {
        deviceInfo = JSON.stringify(data.deviceinfo, null, 2);
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

function registerDevice() {
    socket.emit('startDevice', {
        socketid: MY_WS_ID,
        source: DEVICE_TYPE,
        userid: USER_ID
    });
}

function welcomeUser(username) {
    login_text = document.getElementById('floating-login')
    // Clear any existing content
    login_text.innerHTML = '';
    login_text.appendChild(document.createElement('span')).textContent = 'Welcome ' + username + '!';
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
        let eventType = event_json.eventType;
        let triggeringElement = event_json.triggeringElement;

        // If the event is attached to the document/body
        if (triggeringElement === "document" || triggeringElement === "body") {
            let target = (triggeringElement === "body") ? document.body : document;
            target.addEventListener(eventType, (event) => {
                socket.emit("ui_event", {
                    type: eventType,
                    element: triggeringElement,
                    username: USER_ID,
                    timestamp: Date.now()
                });
            });
        } else {
            // Attach to all elements of the specified type
            let elements = document.querySelectorAll(triggeringElement);
            for (let j = 0; j < elements.length; j++) {
                elements[j].addEventListener(eventType, function(event) {
                    socket.emit("ui_event", {
                        type: eventType,
                        element: this.id || this.name || this.tagName,
                        username: USER_ID,
                        timestamp: Date.now()
                    });
                });
            }
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
