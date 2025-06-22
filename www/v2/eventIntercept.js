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

    socket.on('unauthenticated', (data) => {
        console.log('User not authenticated: ' + data.message);
    });

    socket.on('connect', () => {
        MY_WS_ID = socket.id;
        console.log('Connected to server with Socket ID ' + MY_WS_ID);
    });


    socket.on('unregister', (data) => {
        //remove device info from the table
        let deviceInfoTable = document.getElementById('deviceInfoTable');
        for (let i = 0; i < deviceInfoTable.rows.length; i++) {
            if (deviceInfoTable.rows[i].cells[0].textContent === data.socketid) {
                deviceInfoTable.deleteRow(i);
                console.log('Device ID ' + data.socketid + ' removed from the table');
                break; // Exit loop after removing the device
            }
        }
        console.log('Disconnected from server: ' + data.message);
    });

    socket.on('registered', (data) => {
        console.log('Registered device ' + DEVICE_TYPE + ' with User ID ' + data.username);
        let head = document.head;
        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css';
        link.integrity = 'sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC';
        link.crossOrigin = 'anonymous';
        head.appendChild(link);
        let script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js';
        script.integrity = 'sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM';
        script.crossOrigin = 'anonymous';
        head.appendChild(script);
        captureEvents(data.event_list);
        console.log('Device Connected: ' + JSON.stringify(data.deviceinfo));
        login_text = document.getElementById('floating-login');        
        //add collapse button to the floating login text, if not already present but still add device info table only
        if (login_text.querySelector('.btn-secondary')) {
            //check if deviceID is already in the table
            let deviceInfoTable = document.getElementById('deviceInfoTable');
            for (let i = 0; i < deviceInfoTable.rows.length; i++) {
                if (deviceInfoTable.rows[i].cells[0].textContent === data.deviceinfo.deviceid) {
                    console.log('Device ID already exists in the table, not adding again');
                    return; // Device ID already exists, no need to add again
                }
            }
            // add to table instead of creating a new one
            deviceInfoTable = document.getElementById('deviceInfoTable');
            let newDeviceRow = deviceInfoTable.insertRow(-1);
            let newDeviceIdCell = newDeviceRow.insertCell(0);
            newDeviceIdCell.id = 'deviceID';
            let newDeviceTypeCell = newDeviceRow.insertCell(1);
            let newDeviceStatusCell = newDeviceRow.insertCell(2);
            let newCurrentDeviceCell = newDeviceRow.insertCell(3);
            newDeviceStatusCell.textContent = data.deviceinfo.status;
            newCurrentDeviceCell.textContent = 'NO';
            newDeviceIdCell.textContent = data.deviceinfo.deviceid;
            newDeviceTypeCell.textContent = data.deviceinfo.deviceType;
            return; // Collapse button already exists, no need to add again
        }
        login_text.innerHTML = '';
        // Create a collapse button to hide device info
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
        login_text.appendChild(document.createElement('br'));
        login_text.appendChild(document.createElement('span')).textContent = 'Welcome ' + data.username + '!';
        login_text.appendChild(document.createElement('br'));

        //Create a table to show device id and logout button
        let table = document.createElement('div');
        table.classList.add('container');
        table.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h5>Device Information</h5>
                    <table class="table table-bordered" id="deviceInfoTable">
                        <thead>
                            <tr>
                                <th scope="col">Device ID</th>
                                <th scope="col">Device Type</th>
                                <th scope="col">Status</th>
                                <th scope="col">Current Device</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td id="deviceID">${data.deviceinfo.deviceid}</td>
                                <td id="deviceType">${data.deviceinfo.deviceType}</td>
                                <td id="deviceStatus">${data.deviceinfo.status}</td>
                                <td id="currentDevice">YES</td>
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

    socket.on('ui_event', (data) => {
        console.log(`UI Event received: ${data.type} on element with ID ${data.element}`);
        if (data.server_event) {
            //trigger event on element with ID data.element
            let element = document.getElementById(data.element);
            if (element) {
                console.log(`Triggering server event: ${data.type} on element with ID ${data.element}`);
                let event = new Event(data.type, { bubbles: true, cancelable: true });
                element.dispatchEvent(event);
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

var PseudoGuid = new (function() {
    this.empty = "00000000-0000-0000-0000-000000000000";
    this.GetNew = function() {
        var fourChars = function() {
            return (((1 + Math.random()) * 0x10000)|0).toString(16).substring(1).toUpperCase();
        }
        return (fourChars() + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + "-" + fourChars() + fourChars() + fourChars());
    };
})();

// Capture all click events on buttons

function captureEvents(event_list) {
    Object.keys(event_list).forEach(event_listType => {
        for (let event of event_list[event_listType]) {
            console.log(`Capturing event: ${event.type}`);
            for (let triggeringElement of event.triggeringElement) {
                attachEvent(event, triggeringElement);
            }
        }
    });
}
function attachEvent(event, triggeringElement) {
    let eventType = event.type;
    console.log(`Attaching event: ${eventType} to ${triggeringElement}`);
    // If the event is attached to the document/body
    if (triggeringElement === "document" || triggeringElement === "body") {
        let target = (triggeringElement === "body") ? document.body : document;
        target.id = PseudoGuid.GetNew(); // Assign a unique ID to the body or document
        target.addEventListener(event.type, (event) => {
            socket.emit("ui_event", {
                    type: event.type,
                    element: target.id,
                    username: USER_ID,
                    timestamp: Date.now()
                });
            // Prevent default action for the element
            event.preventDefault();
            event.stopPropagation();
            });
        // Prevent default action for the element
        } else {
            // Attach to all elements of the specified type
            let elements = document.querySelectorAll(triggeringElement);
            for (let i = 0; i < elements.length; i++) {
                if (!elements[i].id) {
                    elements[i].id = PseudoGuid.GetNew(); // Assign a unique ID if not already present
                }
                elements[i].addEventListener(eventType, function(event) {
                    socket.emit("ui_event", {
                        type: eventType,
                        element: this.id, // Use element's ID or generate a new one
                        username: USER_ID,
                        timestamp: Date.now()
                    });
                    // Prevent default action for the element
                    event.preventDefault();
                    event.stopPropagation();
                });
            }
        }
    }
