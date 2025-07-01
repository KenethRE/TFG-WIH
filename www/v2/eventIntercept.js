let MY_WS_ID = null;
let MY_WS_ID_LOGIN = null;
let DEVICE_TYPE = null;
let USER_ID = null;
let WEBSITE_ID = null;

let socket;

function add_listeners(event) {
    let data;
    switch (event.type) {
        case 'click':
        case 'input':
        case 'change':
        case 'submit':
        case 'focus':
        case 'blur':
        case 'keydown':
        case 'keyup':
        case 'keypress':
            data = {
                type: event.type,
                elementId: event.target.id || '',
                deviceId: MY_WS_ID,
                userId: USER_ID,
                key: event.key || '',
                code: event.code || '',
                keyCode: event.keyCode || 0,
                which: event.which || 0,
                value: event.target.value || ''
            };
            break;
        case 'mouseover':
        case 'mouseout':
        case 'mousemove':
        case 'contextmenu':
        case 'dblclick':
        case 'wheel':
        case 'touchstart':
        case 'touchmove':
        case 'touchend':
            event.preventDefault();
            break;
    }
    return data;
}

function socketSetup() {
    socket = io();

    socket.on('login_success', (data) => {
        console.log('Login successful for User ID ' + data.username);
        USER_ID = data.username;
        socket.emit('registerDevice', {
            username: USER_ID,
            socketid: MY_WS_ID,
            deviceType: DEVICE_TYPE,
            website_id: WEBSITE_ID,
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

    socket.on('elements', (data) => {
        WEBSITE_ID = data.website;
        for (let element of data.elements) {
            console.log(`Processing event: ${element.eventType} with id ${element.assignedId} on element ${element.element}`);
            // assign element.id if it doesn't exist
            element = document.getElementById(element.assignedId) || element;
            if (!document.getElementById(element.assignedId)) {
                for (let tag of document.getElementsByTagName(element.element)) {
                    if (!tag.id) {
                        tag.id = element.assignedId;
                        console.log(`Assigned ID ${element.assignedId} to element <${element.element}>`);
                    }
                    else {
                        console.warn(`Element <${element.element}> already has an ID: ${tag.id}. Skipping assignment.`);

                    }
                }
            }
        }
        socket.emit('elements_processed', {
            socketid: MY_WS_ID,
            website_id: WEBSITE_ID,
            userid: USER_ID,
            message: 'Elements processed successfully'
        });
    });


    socket.on('add_listeners', (data) => {
        for (let element of data.elements) {
            console.log(`Adding listener for event: ${element.eventType} on element with ID ${element.assignedId}`);
            let targetElement = document.getElementById(element.assignedId);
            if (targetElement) {
                targetElement.addEventListener(element.eventType, (event) => {
                    if (event.isTrusted) {
                        console.log(`User event: ${event.type} on element with ID ${element.assignedId}`);
                        socket.emit('send_event', {
                        type: element.eventType,
                        elementId: element.assignedId,
                        deviceId: MY_WS_ID,
                        userId: USER_ID,
                        key: event.key || '',
                        code: event.code || '',
                        keyCode: event.keyCode || 0,
                        which: event.which || 0,
                        value: event.target.value || '',
                        clientX: event.clientX || 0,
                        clientY: event.clientY || 0,
                        targetTouches: event.targetTouches || [],
                        touches: Array.from(event.touches || []).map(touch => ({
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            identifier: touch.identifier
                        })) || [],
                        changedTouches: Array.from(event.changedTouches || []).map(touch => ({
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            identifier: touch.identifier
                        })) || [],
                        timestamp: event.timestamp
                        });
                    console.log(`Event ${element.eventType} triggered on element with ID ${element.assignedId}`);
                    } else {
                        console.warn(`Server event: ${event.type} on element with ID ${element.assignedId}`);
                    }                 
                });
            }
        }
    });

    socket.on('receive_event', (data) => {
        if (data.socketid !== MY_WS_ID) {
            console.log(`UI Event received from ${data.socketid}: ${data.type} on element with ID ${data.elementId}`);
            //trigger event on element with ID data.elementId
            if (!data.elementId) {
                console.warn(`Element ID not provided for event: ${data.type}`);
                return;
            }
            let element = document.getElementById(data.elementId);
            if (element) {
                console.log(`Triggering server event: ${data.type} on element with ID ${data.elementId}`);
                switch (data.type) {
                    case 'click':
                        element.click(); // Simulate click event
                        break;
                    case 'input':
                        element.value = data.value || ''; // Set value for input events
                        element.dispatchEvent(new Event('input', {
                            bubbles: true,
                            cancelable: true,
                            composed: true
                        }));
                        break;
                    case 'change':
                        element.dispatchEvent(new Event('change', {
                            bubbles: true,
                            cancelable: true,
                            composed: true
                        }));
                        break;
                    case 'submit':
                        element.dispatchEvent(new Event('submit', {
                            bubbles: true,
                            cancelable: true,
                            composed: true
                        }));
                        break;
                    case 'focus':
                        element.dispatchEvent(new Event('focus', {
                            bubbles: true,
                            cancelable: true,
                            composed: true
                        }));
                        break;
                    case 'blur':
                        element.dispatchEvent(new Event('blur', {
                            bubbles: true,
                            cancelable: true,
                            composed: true
                        }));
                        break;
                    case 'keydown':
                        element.dispatchEvent(new KeyboardEvent('keydown', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            key: data.key || '',
                            code: data.code || '',
                            keyCode: data.keyCode || 0,
                            which: data.which || 0
                        }));
                        break;
                    case 'keyup':
                        element.dispatchEvent(new KeyboardEvent('keyup', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            key: data.key || '',
                            code: data.code || '',
                            keyCode: data.keyCode || 0,
                            which: data.which || 0
                        }));
                        break;
                    case 'keypress':
                        element.dispatchEvent(new KeyboardEvent('keypress', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            key: data.key || '',
                            code: data.code || '',
                            keyCode: data.keyCode || 0,
                            which: data.which || 0
                        }));
                        break;
                    case 'mouseover':
                        element.dispatchEvent(new MouseEvent('mouseover', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            clientX: data.clientX || 0,
                            clientY: data.clientY || 0
                        }));
                        break;
                    case 'mouseout':
                        element.dispatchEvent(new MouseEvent('mouseout', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            clientX: data.clientX || 0,
                            clientY: data.clientY || 0
                        }));
                        break;
                    case 'mousemove':
                        element.dispatchEvent(new MouseEvent('mousemove', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            clientX: data.clientX || 0,
                            clientY: data.clientY || 0
                        }));
                        break;
                    case 'touchstart':
                        element.dispatchEvent(new TouchEvent('touchstart', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            touches: [new Touch({
                                clientX: data.clientX || 0,
                                clientY: data.clientY || 0,
                                identifier: data.identifier || 0
                            })],
                            changedTouches: [new Touch({
                                clientX: data.changedTouches?.[0]?.clientX || 0,
                                clientY: data.changedTouches?.[0]?.clientY || 0,
                                identifier: data.changedTouches?.[0]?.identifier || 0
                            })]
                        }));
                        break;
                    case 'touchend':
                        element.dispatchEvent(new TouchEvent('touchend', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            touches: data.touches || [],
                            targetTouches: data.targetTouches || [],
                            changedTouches: data.changedTouches || []
                        }));
                        break;
                    case 'touchmove':
                        element.dispatchEvent(new TouchEvent('touchmove', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            touches: data.touches || [],
                            targetTouches: data.targetTouches || [],
                            changedTouches: data.changedTouches || []
                        }));
                        break;
                    case 'contextmenu':
                        element.dispatchEvent(new MouseEvent('contextmenu', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            clientX: data.clientX || 0,
                            clientY: data.clientY || 0
                        }));
                        break;
                    case 'dblclick':
                        element.dispatchEvent(new MouseEvent('dblclick', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            clientX: data.clientX || 0,
                            clientY: data.clientY || 0
                        }));
                        break;
                    case 'wheel':
                        element.dispatchEvent(new WheelEvent('wheel', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            deltaX: data.deltaX || 0,
                            deltaY: data.deltaY || 0,
                            deltaZ: data.deltaZ || 0,
                            deltaMode: data.deltaMode || 0
                        }));
                        break;
                    case 'scroll':
                        element.dispatchEvent(new Event('scroll', {
                            bubbles: true,
                            cancelable: true,
                            composed: true
                        }));
                        break;
                    default:
                        // If the event type is not recognized, log a warning
                        console.warn(`Unknown event type: ${data.type}. Dispatching generic event.`);
                }
                }
                // Dispatch the event with the provided event detail
                console.log(`Event ${data.type} dispatched on element with ID ${data.elementId}`);
            }
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


