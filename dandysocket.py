import multiprocessing as mp
import asyncio
import websockets
import atexit
import os
import sys

from .constants import *
from .services import DandyService

### Spawned Process ================================================================
async def start_service(ws, path):
  service = DandyService(ws)
  await service.run_loop()
  
async def start_server():
  print("DandySocket :: starting server")
  async with websockets.serve(start_service, 'localhost', DANDY_WS_PORT):
    try:
      await asyncio.Future()
    except asyncio.CancelledError:
      pass
    except Exception:
      pass
  print("DandySocket :: ending")

def run_server():
  try:
    asyncio.run(start_server())
  except Exception:
    pass
  
### Main Process ================================================================
def launch_server():
  script_path = os.path.abspath(__file__)
  dandy_module_path = os.path.dirname(script_path)
  custom_nodes_path = os.path.dirname(dandy_module_path)

  sys.path.append(custom_nodes_path)
  ctx = mp.get_context('spawn')
  q = ctx.Queue()
  server_process = ctx.Process(target=run_server)
  server_process.start()

  def shutdown():
    server_process.join()

  atexit.register(shutdown)
