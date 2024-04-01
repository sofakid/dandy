import multiprocessing as mp
import asyncio
import websockets
import json
import atexit
import os
import sys

from .constants import *

async def handle_client(websocket, path):
  async for message in websocket:
    # Here you handle messages received from JavaScript
    print(f'Received message from JavaScript: {message}')
    # Example: Send a response back to JavaScript
    await websocket.send('{ respy: "Response from Python" }')

async def start_server():
  async with websockets.serve(handle_client, 'localhost', DANDY_WS_PORT):
    try:
      await asyncio.Future()
    except asyncio.CancelledError:
      print('exiting dandy socket...')
      pass

def run_server():
  print('Dandy :: Starting with run_server')
  asyncio.run(start_server())

def launch_server():
  script_path = os.path.abspath(__file__)
  print('Dandy :: Path to the main process:', script_path)
  dandy_module_path = os.path.dirname(script_path)
  custom_nodes_path = os.path.dirname(dandy_module_path)
  print('Dandy :: custom_nodes_path:', custom_nodes_path)

  sys.path.append(custom_nodes_path)
  # cwd = os.getcwd()
  # print('Dandy :: cwd: ' + cwd)
  # os.chdir(custom_nodes_path)
  ctx = mp.get_context('spawn')
  q = ctx.Queue()
  server_process = ctx.Process(target=run_server)#, args=(,))
  server_process.start()
  # os.chdir(cwd)

  def shutdown():
    server_process.join()

  atexit.register(shutdown)

print('Dandy :: __name__: ' + mp.current_process().name)
print('Dandy :: sys.path: ' + str(sys.path))
print('Dandy :: __name__: ' + mp.current_process().name)

if mp.current_process().name == 'MainProcess':
  launch_server()

async def send_message_async(data):
  async with websockets.connect('ws://localhost:' + str(DANDY_WS_PORT)) as websocket:
    s = json.dumps(data)
    print('send_message(): ' + s)
    await websocket.send(s)
    response = await websocket.recv()
    print('response: ' + response)
    return json.loads(response)
      
def send_data(data):
  return asyncio.run(send_message_async(data))
    