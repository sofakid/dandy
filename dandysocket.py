import subprocess
import threading
import asyncio
import websockets
import atexit
import os
import sys

# Fix for Windows portable embedded Python in child subprocess
# We have to do this before the from imports 
script_path = os.path.abspath(__file__)
dandy_path = os.path.dirname(script_path)  # custom_nodes/dandy
custom_nodes_path = os.path.dirname(dandy_path)
comfyui_root = os.path.dirname(custom_nodes_path) 

if comfyui_root not in sys.path:
  sys.path.insert(0, comfyui_root)

if custom_nodes_path not in sys.path:
  sys.path.insert(0, custom_nodes_path)

if dandy_path not in sys.path:
  sys.path.insert(0, dandy_path)

# we can't use relative paths because this file is run as a script and a module
from dandy.common import *
from dandy.services import DandyService

### Child Process ================================================================
async def start_service(ws):
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
  print("DandySocket :: launching server")

  dandy_path = os.path.dirname(__file__)  # custom_nodes/dandy
  custom_nodes_path = os.path.dirname(dandy_path)

  script_path = os.path.join(dandy_path, 'dandysocket.py')

  env = os.environ.copy()
  server_process = subprocess.Popen(
    [sys.executable, '-u', script_path, DANDY_CHILD_PROCESS],
    cwd=custom_nodes_path,
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    bufsize=1,
    universal_newlines=True
  )

  def stream_output():
    for line in server_process.stdout:
      print("DandySocket child :: " + line.rstrip())

  threading.Thread(target=stream_output, daemon=True).start()

  def shutdown():
    print("DandySocket :: terminating server")
    server_process.terminate()
    server_process.wait(timeout=5)

  atexit.register(shutdown)

if dandy_is_child():
  run_server()
