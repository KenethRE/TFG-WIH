import requests
from bs4 import BeautifulSoup
import json
import uuid, sys

def load_event_definitions(path='event_definitions.json'):
    with open(path, 'r') as f:
        return json.load(f)

def get_html(url):
    response = None
    if url == 'https://localhost':
        # For local testing, use a predefined HTML file
        with open('../www/version2.html', 'r') as f:
            return f.read()
    # Fetch the HTML content from the provided URL
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def assign_ids_to_elements(url):
    if url == 'https://localhost':
        # For local testing, use a predefined HTML file
        with open('../www/version2.html', 'r') as f:
            html = f.read()
    else:
        # Fetch the HTML content from the provided URL
        html = get_html(url)
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    event_definitions = load_event_definitions('event_definitions.json')
    for category, events in event_definitions.items():
        for event in events:
            event_type = event['type']
            triggering_elements = event['triggeringElement']
            for elem_type in triggering_elements:
                for tag in soup.find_all(elem_type):
                    # Assign a unique ID if not present
                    if not tag.has_attr('id'):
                        unique_id = f"auto-{uuid.uuid4()}"
                        tag['id'] = unique_id
                    else:
                        unique_id = tag['id']
                    results.append({
                        'eventType': event_type,
                        'element': elem_type,
                        'assignedId': unique_id,
                        'outerHTML': str(tag)
                    })
    return results

if __name__ == '__main__':
    # Get URL from params
    url = sys.argv[1] if len(sys.argv) > 1 else None
    if url is None:
        print("Please provide a URL as a command line argument.")
        sys.exit(1)
    event_definitions = load_event_definitions('event_definitions.json')
    elements_with_ids = assign_ids_to_elements(url)
    file = './custom_elements/{}_elements.json'.format(url.split('/')[2])
    with open(file, 'w') as f:
       json.dump(elements_with_ids, f, indent=2, ensure_ascii=False)
    f.close()
    print(f"Assigned IDs to elements and saved to {file}")
