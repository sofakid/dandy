import { dandy_delay } from "/extensions/dandy/dandymisc.js"
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
  constructor() {
    this.socket = null
    this._service_id = null

    connectWebSocket()
      .then((socket) => {
        this.socket = socket
        socket.addEventListener('message', (event) => {
          console.log('DandyServices ::', event.data.slice(0, 200))
          const response = JSON.parse(event.data)
          const { command, py_client } = response
          
          if (command === 'set_service_id') {
            this._service_id = response.service_id
          }
    
          if (command === 'request_captures') {
            this.on_request_captures(py_client)
          }
    
          if (command === 'request_hash') {
            this.on_request_hash(py_client)
          }
    
          if (command === 'delivering_images') {
            const { images } = response 
            this.on_delivering_images(py_client, images)
          }
    
          if (command === 'delivering_masks') {
            const { masks } = response 
            this.on_delivering_masks(py_client, masks)
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
    console.log('socket sending: ' + JSON.stringify(command).slice(0, 80))
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

  deliver_captures(b64captures, py_client) {
    this.send({ 'command': 'delivering_captures', 'captures': b64captures, 'py_client': py_client })
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

}
