import json

import requests
import websocket

pages = requests.get('http://127.0.0.1:9223/json', timeout=5).json()
page = next(item for item in pages if item.get('type') == 'page')
connection = websocket.create_connection(page['webSocketDebuggerUrl'])
expression = """JSON.stringify({
  innerWidth,
  docScroll: document.documentElement.scrollWidth,
  bodyScroll: document.body.scrollWidth,
  status: getComputedStyle(document.querySelector('.status-page')).width,
  card: document.querySelector('.status-page-card').getBoundingClientRect().toJSON(),
  header: document.querySelector('.status-page-header').getBoundingClientRect().toJSON(),
  controls: document.querySelector('.status-page-header > div').getBoundingClientRect().toJSON()
})"""
connection.send(json.dumps({'id': 1, 'method': 'Runtime.evaluate', 'params': {'expression': expression, 'returnByValue': True}}))
print(connection.recv())
connection.close()
