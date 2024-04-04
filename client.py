import asyncio
import websockets
import json
from .constants import *
from .image import make_b64image

async def send_data_async(data):
  async with websockets.connect('ws://localhost:' + str(DANDY_WS_PORT)) as websocket:
    websocket.max_size=MAX_DANDY_SOCKET_MSG
    print('DandyServicesClient :: get_service_id ')
    await websocket.send('{ "command": "get_service_id" }')
    response = await websocket.recv()
    print('DandyServicesClient :: get_service_id response: ' + response)
    o = json.loads(response)
    pyc = o['service_id']
    data['py_client'] = pyc
    s = json.dumps(data)
    print('DandyServicesClient :: send_message(): ' + s[:200])
    await websocket.send(s)
    response = await websocket.recv()
    print('DandyServicesClient :: response: ' + response[:200])
    return json.loads(response)
      
    
class DandyServicesClient:
  def __init__(self):
    pass

  def send_data(self, data):
    return asyncio.run(send_data_async(data))

  def request_captures(self, js_client):
    o = self.send_data({ 
      'command': 'request_captures',
      'js_client': js_client
    })
    if (o['command'] == 'delivering_captures'):
      return o['captures']
    return None
  
  def deliver_images(self, js_client, b64):
    print("DandyServicesClient :: deliver_image")
    o = self.send_data({
      'command': 'delivering_images',
      'js_client': js_client,
      'images': b64
    })
    
    if (o['command'] == 'thanks'):
      print("DandyServicesClient :: thanks")
      return True
    
    print("DandyServicesClient :: NO THANKS")
    return None
    
  def deliver_masks(self, js_client, b64):
    print("DandyServicesClient :: deliver_mask")
    o = self.send_data({
      'command': 'delivering_masks',
      'js_client': js_client,
      'masks': b64
    })
    
    if (o['command'] == 'thanks'):
      print("DandyServicesClient :: thanks")
      return True
    
    print("DandyServicesClient :: NO THANKS")
    return None
    

  def request_hash(self, js_client):
    print("DandyServicesClient :: request_hash")
    o = self.send_data({ 
      'command': 'request_hash',
      'js_client': js_client
    })
    
    if (o['command'] == 'delivering_hash'):
      print("DandyServicesClient :: delivering_hash")
      return o['hash']
    
    print("DandyServicesClient :: NO HASH")
    return None
  
