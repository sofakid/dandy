
import json

i_service = 0

def next_service_id():
  global i_service
  i_service += 1
  return f"dandy_service_{i_service}"

services = {}

class DandyService:
  def __init__(self, ws):
    print("DandyService :: new")
    self.id = next_service_id()
    self.ws = ws
    services[self.id] = self
    print("DandyService :: constructed")
 
  async def send(self, o):
    msg = json.dumps(o)
    return await self.ws.send(msg)

  async def run_loop(self):
    print("DandyService :: run_loop()")
    async for msg in self.ws:
      print("DandyService :: msg recieved: " + str(msg)[:80])
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
    jsc = o['js_client']
    jsc_service = services[jsc]
    await jsc_service.send(o)

  async def delivering_captures(self, o):
    pyc = o['py_client']
    pyc_service = services[pyc]
    await pyc_service.send(o)

   
  
