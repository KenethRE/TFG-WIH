import requests
from bs4 import BeautifulSoup
import json
import uuid

def load_event_definitions(path='event_definitions.json'):
    with open(path, 'r') as f:
        return json.load(f)

def get_html(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def assign_ids_to_elements(html, event_definitions):
    soup = BeautifulSoup(html, 'html.parser')
    results = []
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
    url = 'https://tfg.zenken.es/v1v2/version2.html'  # Example URL
    event_definitions = load_event_definitions('event_definitions.json')
    html = get_html(url)
    elements_with_ids = assign_ids_to_elements(html, event_definitions)
    file = '{}_elements.json'.format(url.split('/')[2])
    with open(file, 'w') as f:
       json.dump(elements_with_ids, f, indent=2, ensure_ascii=False)
    f.close()
    print(f"Assigned IDs to elements and saved to {file}")
