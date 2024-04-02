import asyncio
import websockets
import json
from .constants import *

async def send_data_async(data):
  async with websockets.connect('ws://localhost:' + str(DANDY_WS_PORT)) as websocket:
    await websocket.send('{ "command": "get_service_id" }')
    response = await websocket.recv()
    print('get_service_id response: ' + response)
    o = json.loads(response)
    pyc = o['service_id']
    data['py_client'] = pyc
    s = json.dumps(data)
    print('send_message(): ' + s[:80])
    await websocket.send(s)
    response = await websocket.recv()
    print('response: ' + response[:80])
    return json.loads(response)
      
    
class DandyServicesClient:
  def __init__(self):
    pass

  def send_data(self, data):
    return asyncio.run(send_data_async(data))

  def request_captures(self, jsc):
    o = self.send_data({ 
      'command': 'request_captures',
      'js_client': jsc
    })
    if (o['command'] == 'delivering_captures'):
      return o['captures']
    return None
  
