import asyncio
import websockets
from websockets.exceptions import ConnectionClosedOK
import json
from .constants import *
from .dandynodes import *
from .image import make_b64image

async def send_data_async(data):
  try:  
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
  except ConnectionClosedOK:
    print("DandyServicesClient :: websocket closed")
  return None
    
class DandyServicesClient:
  def __init__(self):
    pass

  def send_data(self, data):
    return asyncio.run(send_data_async(data))

  def request_captures(self, js_client,
                       int, float, boolean, string, 
                       positive, negative, b64images, b64masks):
    x = { 
      'command': 'request_captures',
      'js_client': js_client,
      'int': int,
      'float': float,
      'boolean': boolean,
      'string': string,
      'positive': positive,
      'negative': negative,
      'image': b64images,
      'mask': b64masks
    }
    #print('DandyClient, sending: ' + str(x))
    o = self.send_data(x)
    if (o['command'] == 'delivering_captures'):
      return o
    return None
  
  def request_string(self, js_client):
    # print("DandyServicesClient :: request_prompt")
    o = self.send_data({ 
      'command': 'request_string',
      'js_client': js_client
    })
    
    if (o['command'] == 'delivering_string'):
      # print("DandyServicesClient :: delivering_prompt")
      return o['string']
    
    print("DandyServicesClient :: NO PROMPT")
    return None

  def send_input(self, js_client, input):
    # print("DandyServicesClient :: send_inputs")
    return self.send_data({ 
      'command': 'sending_input',
      'js_client': js_client,
      'input': input
    })
    