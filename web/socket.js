import { dandy_delay, DandyNames } from "/extensions/dandy/dandymisc.js"
const DANDY_WS_PORT = 7872

const connectWebSocket = () => {
  return new Promise((resolve, reject) => {
    let retries = 0
    const max_retries = 20
    const retry_delay = 500

    function attemptConnection() {
      const socket = new WebSocket(`ws://localhost:${DANDY_WS_PORT}`);

      socket.onopen = () => {
        resolve(socket)
      }

      socket.onerror = () => {
        console.log("WebSocket connection error")
        ++retries
        if (retries < max_retries) {
          console.warn(`DandySocket :: Retrying connection (Attempt ${retries} of ${max_retries})...`)
          setTimeout(attemptConnection, retry_delay)
        } else {
          reject(new Error("DandySocket :: Exceeded maximum number of retries"))
        }
      }
    }

    attemptConnection()
  })
}

export class DandySocket {
  constructor(dandy=null) {
    this.socket = null
    this._service_id = null

    if (dandy !== null) {
      const service_widget = dandy.service_widget = dandy.find_widget(DandyNames.SERVICE_ID)
      service_widget.serializeValue = async () => {
        console.warn(`${dandy.constructor.name} :: Serializing service_id...`)
        return await this.get_service_id()
      }
    }

    connectWebSocket()
      .then((socket) => {
        this.socket = socket
        socket.addEventListener('message', (event) => {
          console.log('DandyServices :: recv: ', event.data.slice(0, 200))
          const response = JSON.parse(event.data)
          const { command, py_client } = response
          
          if (command === 'set_service_id') {
            this._service_id = response.service_id
          }
    
          if (command === 'request_captures') {
            this.on_request_captures(response)
          }

          if (command === 'request_string') {
            this.on_request_string(response)
          }
    
          if (command === 'request_hash') {
            this.on_request_hash(py_client)
          }
    
          if (command === 'delivering_fonts') {
            const { fonts } = response 
            this.on_delivering_fonts(fonts)
          }
          
        })
        
        this.send({ 'command': 'get_service_id' })
      })
      .catch((error) => {
          console.error("Failed to establish WebSocket connection:", error)
      })

    this.on_request_captures = (py_client) => {
      console.warn("default on_request_captures()")
    }

    this.on_request_string = (py_client) => {
      console.warn("default on_request_string()")
    }

    this.on_request_hash = (py_client) => {
      console.warn("default on_request_hash()")
    }

    this.on_delivering_fonts = (fonts) => {
      console.warn("default on_delivering_fonts()")
    }

    this.on_delivering_images = () => {
      console.warn("default on_delivering_images()")
    }

    this.on_delivering_masks = () => {
      console.warn("default on_delivering_masks()")
    }
  }

  send(command) {
    console.log('DandyServices :: send: ' + JSON.stringify(command).slice(0, 80))
    this.socket.send(JSON.stringify(command))
  }

  async wait_until_up() {
    for (let i = 1; this._service_id === null; ++i) {
      const ms = 10 * i
      const ten_sec = 1000
      if (i === ten_sec) {
        console.error("DandySocket isn't getting its service_id...")
        --i
      }
      await dandy_delay(ms)
    }
  }

  // service_id widget will wait on this when the prompt is queued 
  async get_service_id() {
    await this.wait_until_up()
    return this._service_id
  }

  deliver_captures(o) {
    o.command = 'delivering_captures'
    this.send(o)
  }
  
  deliver_hash(hash, py_client) {
    this.send({ 'command': 'delivering_hash', 'hash': hash, 'py_client': py_client })
  }

  thanks(py_client) {
    this.send({ 'command': 'thanks', 'py_client': py_client })
  }

  request_fonts() {
    this.send({ 'command': 'request_fonts' })
  }

  deliver_string(o) {
    o.command = 'delivering_string'
    this.send(o)
  }

}
