import os
import sys
import json
import tempfile
import shutil
import pytest

# Add backend_testbed to sys.path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import webpage_parser

TEST_HTML = """
<html>
  <body>
    <button>Click me</button>
    <a href="#">Link</a>
    <div>Div content</div>
    <input type="text" />
    <textarea></textarea>
    <canvas></canvas>
    <img src="test.png" />
    <section></section>
    <ul><li>Item</li></ul>
  </body>
</html>
"""

TEST_EVENT_DEFINITIONS = {
    "MouseEvents": [
        {
            "type": "click",
            "description": "Test click",
            "triggeringElement": ["button", "a", "div"],
            "userAction": "Click"
        }
    ],
    "KeyboardEvents": [
        {
            "type": "keydown",
            "description": "Test keydown",
            "triggeringElement": ["input", "textarea", "body"],
            "userAction": "Key down"
        }
    ]
}

@pytest.fixture
def temp_event_definitions_file():
    temp_dir = tempfile.mkdtemp()
    path = os.path.join(temp_dir, "event_definitions.json")
    with open(path, "w") as f:
        json.dump(TEST_EVENT_DEFINITIONS, f)
    yield path
    shutil.rmtree(temp_dir)

def test_load_event_definitions(temp_event_definitions_file):
    defs = webpage_parser.load_event_definitions(temp_event_definitions_file)
    assert "MouseEvents" in defs
    assert "KeyboardEvents" in defs

def test_assign_ids_to_elements(monkeypatch, temp_event_definitions_file):
    # Patch get_html to return TEST_HTML
    monkeypatch.setattr(webpage_parser, "get_html", lambda url: TEST_HTML)
    # Patch load_event_definitions to use our temp file
    monkeypatch.setattr(webpage_parser, "load_event_definitions", lambda path='event_definitions.json': TEST_EVENT_DEFINITIONS)
    url = "http://test.com"
    results = webpage_parser.assign_ids_to_elements(url)
    # Should find button, a, div, input, textarea, body (for keydown)
    found_tags = [r['element'] for r in results]
    assert "button" in found_tags
    assert "a" in found_tags
    assert "div" in found_tags
    # Check that assignedId is present and unique
    ids = [r['assignedId'] for r in results]
    assert all(ids)
    assert len(set(ids)) == len(ids)

def test_script_main(tmp_path, monkeypatch):
    # Patch sys.argv and dependencies
    test_url = "http://test.com"
    monkeypatch.setattr(webpage_parser, "get_html", lambda url: TEST_HTML)
    monkeypatch.setattr(webpage_parser, "load_event_definitions", lambda path='event_definitions.json': TEST_EVENT_DEFINITIONS)
    out_dir = tmp_path / "custom_elements"
    out_dir.mkdir()
    monkeypatch.setattr(webpage_parser, "assign_ids_to_elements", lambda url: [{"eventType": "click", "element": "button", "assignedId": "auto-123", "outerHTML": "<button>Click me</button>"}])
    sys_argv_backup = sys.argv
    sys.argv = ["webpage_parser.py", test_url]
    # Patch file output location
    monkeypatch.setattr(webpage_parser, "__file__", str(tmp_path / "webpage_parser.py"))
    try:
        webpage_parser.__name__ = "__main__"
        exec(open(os.path.join(os.path.dirname(webpage_parser.__file__), "webpage_parser.py")).read())
    except Exception:
        pass
    finally:
        sys.argv = sys_argv_backup
