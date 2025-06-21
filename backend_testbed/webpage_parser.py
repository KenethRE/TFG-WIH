import requests
from bs4 import BeautifulSoup
import json

# This module is responsible for parsing webpage content and extracting all tags that could trigger an event that needs to be sent to the websocket server.

def load_event_definitions(path='event_definitions.json'):
    with open(path, 'r') as f:
        return json.load(f)

def get_html(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def extract_event_elements_v2(html, event_definitions):
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    for category, events in event_definitions.items():
        for event in events:
            event_type = event['type']
            description = event['description']
            triggering_elements = event['triggeringElement']
            for elem_type in triggering_elements:
                found = soup.find_all(elem_type)
                for tag in found:
                    results.append({
                        'eventType': event_type,
                        'element': str(tag),
                        'category': category,
                        'triggeringElement': elem_type
                    })
    return results

def parse_webpage_for_events_v2(url, event_definitions_path='event_definitions_2.json'):
    html = get_html(url)
    event_definitions = load_event_definitions(event_definitions_path)
    return extract_event_elements_v2(html, event_definitions)

if __name__ == '__main__':
    # Ejemplo de uso
    url = 'https://tfg.zenken.es/'
    events = parse_webpage_for_events_v2(url)
    print(json.dumps(events, indent=2, ensure_ascii=False))


# Ejemplo de uso:
# events = parse_webpage_for_events('https://ejemplo.com')
# for e in events:
#     print(e['eventType'], e['element'])

