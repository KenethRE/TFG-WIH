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

def extract_event_elements(html, event_definitions):
    soup = BeautifulSoup(html, 'html.parser')
    results = []
    for event in event_definitions:
        for elem_type in event['elements']:
            # Normaliza el tipo de elemento
            if elem_type.lower() == 'body':
                found = soup.find_all('body')
            elif elem_type.lower() == 'html elements':
                # Busca todos los tags estándar de HTML
                found = soup.find_all(True)
            else:
                found = soup.find_all(elem_type)
            for tag in found:
                results.append({
                    'eventType': event['eventType'],
                    'element': str(tag),
                    'description': event['description']
                })
    return results

def parse_webpage_for_events(url, event_definitions_path='event_definitions.json'):
    html = get_html(url)
    event_definitions = load_event_definitions(event_definitions_path)
    return extract_event_elements(html, event_definitions)

if __name__ == '__main__':
    # Ejemplo de uso
    url = 'https://tfg.zenken.es/version2.html'
    events = parse_webpage_for_events(url)
    for event in events:
        print(event['eventType'], event['element'])


# Ejemplo de uso:
# events = parse_webpage_for_events('https://ejemplo.com')
# for e in events:
#     print(e['eventType'], e['element'])

