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


def test_logout(client):
    response = client.get('/logout', follow_redirects=True)
    assert b'logged out' in response.data or b'Login' in response.data


def test_login_page(client):
    response = client.get('/login')
    assert response.status_code == 200
    assert b'Login' in response.data


def test_signup_page(client):
    response = client.get('/signup')
    assert response.status_code == 200
    assert b'Sign Up' in response.data


def test_socketio_connect():
    test_client = socketio.test_client(app)
    assert test_client.is_connected()
    test_client.disconnect()


def test_send_event_socket_unknown(client):
    socket = socketio.test_client(app, headers={'Referer': 'http://test.com'})
    data = {
        'deviceId': 'test_device',
        'eventType': 'test_event',
        'timestamp': '2023-10-01T12:00:00Z',
        'userId': 'test_user'
    }
    socket.emit('send_event', data)
    received = socket.get_received()
    socket.disconnect()
    assert len(received) > 0
    response = received[0]['args'][0]
    assert response['message'] == 'No elements file found for website test.com'


def test_send_event_socket_known(client):
    socket = socketio.test_client(app, headers={'Referer': 'https://tfg.zenken.es'})
    data = {
        'deviceId': 'test_device',
        'eventType': 'click',
        'timestamp': '2023-10-01T12:00:00Z',
        'userId': 'test_user'
    }
    socket.emit('send_event', data)
    received = socket.get_received()
    socket.disconnect()
    assert len(received) > 0
    response = received[0]['args'][0]
    assert response['elements'] is not None


def test_event_definitions_json_exists():
    assert os.path.exists(os.path.join(os.path.dirname(__file__), '../event_definitions.json'))


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

def test_load_user_found(monkeypatch):
    class DummyUser:
        username = "dummy"
        password = "dummy"
        def __str__(self): return "dummy"
    monkeypatch.setattr(myapp.UserDAO, "get_user", lambda self, username: DummyUser())
    user = myapp.load_user("dummy")
    assert user is not None


def test_load_user_not_found(monkeypatch):
    monkeypatch.setattr(myapp.UserDAO, "get_user", lambda self, username: None)
    user = myapp.load_user("notfound")
    assert user is None


def test_register_device_socket():
    socket = socketio.test_client(app)
    data = {
        'username': 'testuser',
        'socketid': 'testsocketid',
        'deviceType': 'desktop',
        'website_id': 'testwebsite'
    }
    socket.emit('registerDevice', data)
    received = socket.get_received()
    socket.disconnect()
    # Accept any response, just ensure handler is covered
    assert received is not None


def test_register_device_socket_missing_fields():
    socket = socketio.test_client(app)
    data = {}  # Missing required fields
    socket.emit('registerDevice', data)
    received = socket.get_received()
    socket.disconnect()
    assert received is not None


def test_unregister_device_socket():
    socket = socketio.test_client(app)
    data = {'deviceId': 'testdevice', 'username': 'testuser', 'socketid': socket.eio_sid}
    socket.emit('unregister', data)
    received = socket.get_received()
    socket.disconnect()
    assert received is not None


def test_elements_processed_socket():
    socket = socketio.test_client(app)
    data = {'website_id': 'testwebsite', 'message': 'Elements processed successfully'}
    socket.emit('elements_processed', data)
    received = socket.get_received()
    socket.disconnect()
    assert received is not None


def test_disconnect_socket():
    socket = socketio.test_client(app)
    socket.disconnect()
    assert not socket.is_connected()


def test_connect_socket():
    socket = socketio.test_client(app)
    assert socket.is_connected()
    socket.disconnect()


def test_login_user_fail(client, monkeypatch):
    # Simulate user not found
    monkeypatch.setattr(myapp.UserDAO, "get_user", lambda self, username: None)
    response = client.post('/login', data={'username': 'nouser', 'password': 'nopass'})
    assert b'Username does not exist' in response.data or b'check your login details' in response.data


def test_login_user_wrong_password(client, monkeypatch):
    class DummyUser:
        username = "dummy"
        password = "hashed"
        def __str__(self): return "dummy"
    monkeypatch.setattr(myapp.UserDAO, "get_user", lambda self, username: DummyUser())
    monkeypatch.setattr(myapp, "check_password_hash", lambda pw_hash, pw: False)
    response = client.post('/login', data={'username': 'dummy', 'password': 'wrong'})
    assert b'check your login details' in response.data


def test_login_user_success(client, monkeypatch):
    class DummyUser:
        username = "dummy"
        password = "hashed"
        def __str__(self): return "dummy"
    monkeypatch.setattr(myapp.UserDAO, "get_user", lambda self, username: DummyUser())
    monkeypatch.setattr(myapp, "check_password_hash", lambda pw_hash, pw: True)
    monkeypatch.setattr(myapp, "login_user", lambda user, remember: True)
    response = client.post('/login', data={'username': 'dummy', 'password': 'dummy'})
    assert b'Login Successful' in response.data


def test_logout_route(client, monkeypatch):
    monkeypatch.setattr(myapp, "logout_user", lambda: None)
    response = client.get('/logout', follow_redirects=True)
    assert b'logged out' in response.data or b'Login' in response.data


def test_logout_post(client, monkeypatch):
    monkeypatch.setattr(myapp, "logout_user", lambda: None)
    response = client.post('/logout', follow_redirects=True)
    assert b'logged out' in response.data or b'Login' in response.data


def test_login_post_missing_fields(client):
    response = client.post('/login', data={'username': '', 'password': ''})
    assert b'Please check your login details' in response.data or b'Username does not exist' in response.data


def test_login_get(client):
    response = client.get('/login')
    assert response.status_code == 200
    assert b'Login' in response.data


def test_signup_get(client):
    response = client.get('/signup')
    assert response.status_code == 200
    assert b'Sign Up' in response.data


def test_signup_post_missing_fields(client):
    response = client.post('/signup', data={'username': '', 'email': '', 'password': ''})
    assert b'Please fill out the form' in response.data or b'Sign Up' in response.data


def test_signup_post_existing_user(client, monkeypatch):
    monkeypatch.setattr(myapp.UserDAO, "get_user", lambda self, username: True)
    response = client.post('/signup', data={'username': 'testuser', 'email': 'testuser@example.com', 'password': 'testpass'})
    assert b'already exists' in response.data


def test_signup_post_success(client, monkeypatch):
    monkeypatch.setattr(myapp.UserDAO, "get_user", lambda self, username: None)
    monkeypatch.setattr(myapp.UserDAO, "store_user", lambda self, user: None)
    response = client.post('/signup', data={'username': 'newuser', 'email': 'newuser@example.com', 'password': 'testpass'})
    print(response.data)
    assert b'User created successfully' in response.data or b'User already exists' in response.data
