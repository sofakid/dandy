import subprocess
import threading
import asyncio
import websockets
import atexit
import os
import sys

from .constants import *
from .services import DandyService

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

    dandy_path = os.path.dirname(__file__)
    custom_nodes_path = os.path.dirname(dandy_path)

    env = os.environ.copy()
    if 'PYTHONPATH' in env:
        env['PYTHONPATH'] = custom_nodes_path + os.pathsep + env['PYTHONPATH']
    else:
        env['PYTHONPATH'] = custom_nodes_path

    server_process = subprocess.Popen(
        [sys.executable, '-u', '-m', 'dandy.dandysocket'],
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


# only in the child
if __name__ in ('__main__', 'dandy.dandysocket'):
    run_server()
