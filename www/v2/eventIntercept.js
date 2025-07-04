let MY_WS_ID = null;
let MY_WS_ID_LOGIN = null;
let DEVICE_TYPE = null;
let USER_ID = null;
let WEBSITE_ID = null;

let socket;

function add_listeners(elements) {
    console.log('Adding listeners to elements');
    // Get all elements that match the event definitions
    // Add event listeners to the elements
    for (let element of elements) {
        let targetElement = document.getElementById(element.assignedId) || document.querySelector(element.element);
        if (!targetElement) {
            console.warn(`Element with ID ${element.assignedId} or selector ${element.element} not found.`);
            continue; // Skip this element if not found
        }
        console.log(`Adding event listener for ${element.eventType} on element with tag ${targetElement.tagName} and ID ${element.assignedId}`);
        targetElement.addEventListener(element.eventType, (event) => { // Prevent default action for the event
            console.log(`Event ${element.eventType} triggered on element with ID ${element.assignedId}`);
            // Emit the event to the server only if the event is trusted
            if (!event.isTrusted) {
                console.warn(`Event ${element.eventType} on element with ID ${element.assignedId} is not trusted. Skipping emission.`);
                return; // Skip untrusted events
            }
            let eventTouches = [];
            let eventTargetTouches = [];
            let eventChangedTouches = [];
            let deltaX = 0;
            let deltaY = 0;
            let deltaZ = 0;
            let deltaMode = 0;
            let scrollTop = 0;
            let scrollLeft = 0;
            
            if (event.type === 'touchstart' || event.type === 'touchmove' || event.type === 'touchend') {
                // For touch events, we need to handle the touches array
                event.preventDefault(); // Prevent default touch behavior
                for (let touch of event.touches) {
                    eventTouches.push({
                        identifier: touch.identifier,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        pageX: touch.pageX,
                        pageY: touch.pageY,
                        radiusX: touch.radiusX,
                        radiusY: touch.radiusY,
                        screenX: touch.screenX,
                        screenY: touch.screenY,
                        force: touch.force
                    });
                }
                for (let touch of event.targetTouches) {
                    eventTargetTouches.push({
                        identifier: touch.identifier,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        pageX: touch.pageX,
                        pageY: touch.pageY,
                        radiusX: touch.radiusX,
                        radiusY: touch.radiusY,
                        screenX: touch.screenX,
                        screenY: touch.screenY,
                        force: touch.force
                    });
                }
                for (let touch of event.changedTouches) {
                    eventChangedTouches.push({
                        identifier: touch.identifier,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        pageX: touch.pageX,
                        pageY: touch.pageY,
                        radiusX: touch.radiusX,
                        radiusY: touch.radiusY,
                        screenX: touch.screenX,
                        screenY: touch.screenY,
                        force: touch.force 
                    });
                }
            } else if (event.type === 'wheel') {
                // For wheel events, we need to handle the delta values
                deltaX = event.deltaX;
                deltaY = event.deltaY;
                deltaZ = event.deltaZ; // deltaZ is optional, default to 0
                deltaMode = event.deltaMode; // deltaMode is optional, default to 0
            } else if (event.type === 'scroll') {
                // For scroll events, we can just use the event as is
                scrollTop = targetElement.scrollTop;
                scrollLeft = targetElement.scrollLeft;
            }
            // Emit the event to the server
            console.log(`Emitting event ${element.eventType} for element with ID ${element.assignedId}`);
            // Ensure MY_WS_ID, WEBSITE_ID, and USER_ID are defined before emitting
            if (!MY_WS_ID || !WEBSITE_ID || !USER_ID) {
                console.error('Socket ID, Website ID, or User ID is not defined. Cannot emit event.');
                return; // Exit if any of these IDs are not defined
            }
            // Emit the event with all necessary details                
            socket.emit('send_event', {
                timestamp: event.timeStamp,
                type: element.eventType,
                elementId: element.assignedId,
                value: event.target.value || '',
                socketid: MY_WS_ID,
                website_id: WEBSITE_ID,
                userId: USER_ID,
                key: event.key || '',
                code: event.code || '',
                keyCode: event.keyCode || 0,
                which: event.which || 0,
                clientX: event.clientX || 0,
                clientY: event.clientY || 0,
                touches: eventTouches || [],
                targetTouches: eventTargetTouches || [],
                changedTouches: eventChangedTouches || [],
                deltaX: deltaX,
                deltaY: deltaY,
                deltaZ: deltaZ,
                deltaMode: deltaMode,
                scrollTop: scrollTop,
                scrollLeft: scrollLeft,
                checked: event.target.checked || false, // For checkbox/radio inputs
                identifier: event.identifier || 0
            });
        });
    }
}

async function socketSetup() {
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
    socket.on('error', (data) => {
        console.error('Error from server: ' + data.message);
    });
    socket.on('add_listeners', async (data) => {
    WEBSITE_ID = data.website;
    console.log(`Received elements to process: ${data.elements.length} elements for website ID ${WEBSITE_ID}`);
    if (!data.elements || data.elements.length === 0) {
        console.warn('No elements to process. Skipping listener addition.');
        socket.emit('elements_processed', {
            socketid: MY_WS_ID,
            website_id: WEBSITE_ID,
            userid: USER_ID,
            message: 'No elements to process'
        });
        return;
    }
    await add_listeners(data.elements);
    socket.emit('elements_processed', {
        socketid: MY_WS_ID,
        website_id: WEBSITE_ID,
        userid: USER_ID,
        message: 'Elements processed successfully'
    });
});


    socket.on('receive_event', (data) => {
        if (data.socketid !== MY_WS_ID) {
            //trigger event on element with ID data.elementId
            if (!data.elementId) {
                console.warn(`Element ID not provided for event: ${data.type}`);
                return;
            }
            let element = document.getElementById(data.elementId) || document;
            if (element) {
                let touches = [];
                let targetTouches = [];
                let changedTouches = [];
                // If touches are provided, create Touch objects
                if (data.touches && data.touches.length > 0) {
                    touches = data.touches.map(touch => new Touch({
                        identifier: touch.identifier || 0,
                        clientX: touch.clientX || 0,
                        clientY: touch.clientY || 0,
                        pageX: touch.pageX || 0,
                        pageY: touch.pageY || 0,
                        radiusX: touch.radiusX || 0,
                        radiusY: touch.radiusY || 0,
                        screenX: touch.screenX || 0,
                        screenY: touch.screenY || 0,
                        force: touch.force || 0,
                        target: document.getElementById(data.elementId) || element // Use the element's selector and ID
                    }));
                }
                if (data.targetTouches && data.targetTouches.length > 0) {
                    targetTouches = data.targetTouches.map(touch => new Touch({
                        identifier: touch.identifier || 0,
                        clientX: touch.clientX || 0,
                        clientY: touch.clientY || 0,
                        pageX: touch.pageX || 0,
                        pageY: touch.pageY || 0,
                        radiusX: touch.radiusX || 0,
                        radiusY: touch.radiusY || 0,
                        screenX: touch.screenX || 0,
                        screenY: touch.screenY || 0,
                        force: touch.force || 0,
                        target: document.getElementById(data.elementId) || element // Use the element's selector and ID
                    }));
                }
                if (data.changedTouches && data.changedTouches.length > 0) {
                    changedTouches = data.changedTouches.map(touch => new Touch({
                        identifier: touch.identifier || 0,
                        clientX: touch.clientX || 0,
                        clientY: touch.clientY || 0,
                        pageX: touch.pageX || 0,
                        pageY: touch.pageY || 0,
                        radiusX: touch.radiusX || 0,
                        radiusY: touch.radiusY || 0,
                        screenX: touch.screenX || 0,
                        screenY: touch.screenY || 0,
                        force: touch.force || 0,
                        target: document.getElementById(data.elementId) || element // Use the element's selector and ID
                    }));
                } 
                console.log(`Triggering server event: ${data.type} on element with ID ${data.elementId}`);
                switch (data.type) {
                    case 'click':
                        element.click(); // Simulate click on the element
                        break;
                    case 'input':
                        if (element.type === 'checkbox' || element.type === 'radio') {
                            // For checkbox or radio inputs, set checked state
                            element.checked = data.checked; // Set checked state for checkbox/radio inputs
                            element.dispatchEvent(new Event('change', {
                                bubbles: true,
                                cancelable: true,
                                composed: true
                            }));
                        } else {
                        // For other input types, set value and dispatch input event
                        console.log(`Setting value for input element with ID ${data.elementId}: ${data.value}`);
                        element.value = data.value || ''; // Set value for input events
                        element.dispatchEvent(new Event('input', {
                            bubbles: true,
                            cancelable: true,
                            composed: true
                        }));
                    }
                        break;
                    case 'change':
                        element.value = data.value || ''; // Set value for change events
                        element.dispatchEvent(new Event('change', {
                            bubbles: true,
                            cancelable: true,
                            composed: true
                        }));
                        break;
                    case 'submit':
                        console.log(`Submitting form with ID ${data.elementId}`);
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
                        element.value = data.value || ''; // Set value for keydown events
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
                        //replace value of element with data.value if it exists
                        element.value = data.value || ''; // Set value for keypress events
                        // Dispatch keypress event
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
                    case 'mousedown':
                        // in the case of canvas, make sure to transpose the coordinates to the canvas
                        if (element.tagName.toLowerCase() === 'canvas') {
                            const rect = element.getBoundingClientRect();
                            const canvasX = data.clientX - rect.left;
                            const canvasY = data.clientY - rect.top;
                            // Create a MouseEvent and dispatch it with the provided coordinates
                            element.dispatchEvent(new MouseEvent('mousedown', {
                                bubbles: true,
                                cancelable: true,
                                composed: true,
                                clientX: canvasX,
                                clientY: canvasY
                            }));
                        }
                        break;
                    case 'mouseup':
                        element.dispatchEvent(new MouseEvent('mouseup', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            clientX: data.clientX || 0,
                            clientY: data.clientY || 0
                        }));
                        break;
                    case 'touchstart':   
                        // Create a TouchEvent and dispatch it with the provided touches
                        element.dispatchEvent(new TouchEvent('touchstart', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            touches: touches,
                            targetTouches: targetTouches,
                            changedTouches: changedTouches
                        }));
                        break;
                    case 'touchend':
                        // see if element is clickable, based on coordinates
                        if (data.changedTouches && data.changedTouches.length > 0) {
                            let touch = data.changedTouches[0];
                            let clickableElement = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (clickableElement) {
                                console.log(`Touchend on element with ID ${data.elementId} at (${touch.clientX}, ${touch.clientY}) is clickable.`);
                                clickableElement.click(); // Simulate click on the clickable element
                            } else {
                                console.log(`Touchend on element with ID ${data.elementId} at (${touch.clientX}, ${touch.clientY}) is not clickable.`);
                            }
                        }
                        element.dispatchEvent(new TouchEvent('touchend', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            touches: touches || [],
                            targetTouches: targetTouches || [],
                            changedTouches: changedTouches || []
                        }));
                        break;
                    case 'touchmove':
                        // check if element is canvas, if so, we can simulate a touchmove event
                        if (element.tagName.toLowerCase() === 'canvas') {
                        // Create a TouchEvent and dispatch it with the provided touches
                        element.dispatchEvent(new TouchEvent('touchmove', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                            touches: touches || [],
                            targetTouches: targetTouches || [],
                            changedTouches: changedTouches || []
                        }));

                        if (element.tagName.toLowerCase() === 'input' && element.type === 'range') {
                            // For range inputs, we can simulate a change event
                            element.value = data.value || ''; // Set value for range input
                            element.dispatchEvent(new Event('input', {
                                bubbles: true,
                                cancelable: true,
                                composed: true
                            }));
                        } else if (element.tagName.toLowerCase() === 'select') {
                            // For select elements, we can simulate a change event
                            element.value = data.value || ''; // Set value for select element
                            element.dispatchEvent(new Event('change', {
                                bubbles: true,
                                cancelable: true,
                                composed: true
                            }));
                        }
                        break;
                    }
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
                        // scroll the page to the position of the wheel event
                        if (data.deltaY !== undefined && data.deltaY !== 0) {
                            if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
                                // For textarea or input elements, we can scroll the element
                                element.scrollTop += data.deltaY; // Scroll the element vertically
                            } else {
                                window.scrollBy(0, data.deltaY);
                            }
                        }
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
                } else {
                    // If the event type is not recognized, log a warning
                    console.warn(`No element found with ID ${data.elementId} for event type ${data.type}.`);
                }
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


