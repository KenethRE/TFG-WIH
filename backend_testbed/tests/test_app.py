import os
import sys
import pytest
import json

# Add backend_testbed to sys.path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import myapp
from myapp import app, socketio


@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    with app.test_client() as client:
        yield client


# Test user signup and login functionality
def test_signup_and_login(client):
    # Test signup
    response = client.post('/signup', data={
        'username': 'testuser',
        'email': 'testuser@example.com',
        'password': 'testpass'
    }, follow_redirects=True)
    assert b'User created successfully' in response.data or b'already exists' in response.data

    # Test login
    response = client.post('/login', data={
        'username': 'testuser',
        'password': 'testpass'
    }, follow_redirects=True)
    assert b'logged in' in response.data or b'check your login details' in response.data


# Test user logout functionality
def test_logout(client):
    response = client.get('/logout', follow_redirects=True)
    assert b'logged out' in response.data or b'Login' in response.data


# Test login page rendering
def test_login_page(client):
    response = client.get('/login')
    assert response.status_code == 200
    assert b'Login' in response.data


# Test WebSocket event emission using SocketIO
def test_send_event_socket_unknown(client):
    # Create a socket client using SocketIOTestClient
    socket = socketio.test_client(app, headers={'Referer': 'http://test.com'})  # Create the SocketIO test client
    data = {
        'deviceId': 'test_device',
        'eventType': 'test_event',
        'timestamp': '2023-10-01T12:00:00Z',
        'userId': 'test_user'
    }
    socket.emit('send_event', data)  # Emit event to the server
    
    # Get received events
    received = socket.get_received()
    print(f"Received events: {received}")  # Debugging output
    socket.disconnect()  # Disconnect the socket client after the test
    assert len(received) > 0  # Ensure that something was received

    # Verify the response from the server
    response = received[0]['args'][0]  # Extract the data from the response
    assert response['message'] == 'No elements file found for website test.com'  # Check for the expected error message
def test_send_event_socket_known(client):
    # Create a socket client using SocketIOTestClient
    socket = socketio.test_client(app, headers={'Referer': 'https://tfg.zenken.es'})  # Create the SocketIO test client
    data = {
        'deviceId': 'test_device',
        'eventType': 'click',
        'timestamp': '2023-10-01T12:00:00Z',
        'userId': 'test_user'
    }
    socket.emit('send_event', data)  # Emit event to the server
    
    # Get received events
    received = socket.get_received()
    socket.disconnect()  # Disconnect the socket client after the test
    assert len(received) > 0  # Ensure that something was received

    # Verify the response from the server
    response = received[0]['args'][0]  # Extract the data from the response
    print(response)
    assert response['elements'] is not None  # Check for the expected success message


# Test signup page rendering
def test_signup_page(client):
    response = client.get('/signup')
    assert response.status_code == 200
    assert b'Sign Up' in response.data


# Test SocketIO client connection
def test_socketio_connect():
    # Use SocketIO's test client
    test_client = socketio.test_client(app)
    assert test_client.is_connected()  # Check if the test client is connected
    test_client.disconnect()  # Disconnect after the test


# Test if event_definitions.json exists
def test_event_definitions_json_exists():
    assert os.path.exists(os.path.join(os.path.dirname(__file__), '../event_definitions.json'))


# Test webpage parser assigning IDs to elements
def test_webpage_parser_assign_ids(monkeypatch):
    import webpage_parser
    html = "<html><body><button>Test</button><a href='#'>Link</a><div>Div</div></body></html>"
    monkeypatch.setattr(webpage_parser, "get_html", lambda url: html)
    monkeypatch.setattr(webpage_parser, "load_event_definitions", lambda path='event_definitions.json': {
        "MouseEvents": [
            {
                "type": "click",
                "description": "Test click",
                "triggeringElement": ["button", "a", "div"],
                "userAction": "Click"
            }
        ]
    })
    url = "https://tfg.zenken.es"
    results = webpage_parser.assign_ids_to_elements(url)
    assert any(r['element'] == 'button' for r in results)
    assert any(r['element'] == 'a' for r in results)
    assert any(r['element'] == 'div' for r in results)
    assert all('assignedId' in r for r in results)
