
import json

i_service = 0

def next_service_id():
  global i_service
  i_service += 1
  return f"dandy_service_{i_service}"

services = {}

class DandyService:
  def __init__(self, ws):
    self.id = next_service_id()
    self.ws = ws
    services[self.id] = self
 
  async def send(self, o):
    msg = json.dumps(o)
    return await self.ws.send(msg)

  async def run_loop(self):
    async for msg in self.ws:
      print("DandyService :: msg recieved: " + str(msg)[:200])
      await self.run_command(msg)

  async def run_command(self, msg):
    o = json.loads(msg)
    command = o['command']
    excluded = ['__init__', 'send', 'run_loop', 'run_command']
    if not command in excluded:
      await getattr(self, command)(o)

  ### commands ========================================================
  async def get_service_id(self, o):
    await self.send({ 'command': 'set_service_id', 'service_id': self.id })

  async def request_captures(self, o):
    js_client = o['js_client']
    js_client_service = services[js_client]
    await js_client_service.send(o)

  async def delivering_captures(self, o):
    py_client = o['py_client']
    py_client_service = services[py_client]
    await py_client_service.send(o)

  async def request_hash(self, o):
    js_client = o['js_client']
    js_client_service = services[js_client]
    await js_client_service.send(o)

  async def delivering_hash(self, o):
    py_client = o['py_client']
    py_client_service = services[py_client]
    await py_client_service.send(o)
    

   
  
