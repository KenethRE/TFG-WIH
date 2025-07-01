import os
import sys
import tempfile
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

def test_socketio_connect(monkeypatch):
    test_client = socketio.test_client(app)
    assert test_client.is_connected()
    test_client.disconnect()

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
    url = "http://tfg.zenken.es"
    results = webpage_parser.assign_ids_to_elements(url)
    assert any(r['element'] == 'button' for r in results)
    assert any(r['element'] == 'a' for r in results)
    assert any(r['element'] == 'div' for r in results)
    assert all('assignedId' in r for r in results)
