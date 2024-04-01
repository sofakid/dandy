import asyncio
import websockets
import json
from .constants import *

async def send_data_async(data):
  async with websockets.connect('ws://localhost:' + str(DANDY_WS_PORT)) as websocket:
    s = json.dumps(data)
    print('send_message(): ' + s)
    await websocket.send(s)
    response = await websocket.recv()
    print('response: ' + response)
    return json.loads(response)
      
def send_data(data):
  return asyncio.run(send_data_async(data))
    
class DandyServicesClient:
  def __init__(self):
    o = send_data({ 'command': 'get_service_id' })
    self.service_id = o['service_id']

  def request_captures(self, dst_id):
    o = send_data({ 
      'command': 'request_captures', 
      'dst': dst_id 
    })
    if (o['command'] == 'delivering_captures'):
      return o['captures']
    return None
  
