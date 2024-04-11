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
        console.log("DandySocket :: WebSocket connection error")
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
  debug_log(s, ...more) {
    if (this.debug_verbose) {
      console.log(`${this.constructor.name} :: ${s}`, ...more)
    }
  }
  log(s, ...more) {
    console.log(`${this.constructor.name} :: ${s}`, ...more)
  }
  

  warn_log(s, ...more) {
    console.warn(`${this.constructor.name} :: ${s}`, ...more)
  }

  error_log(s, ...more) {
    console.error(`${this.constructor.name} :: ${s}`, ...more)
  }

  constructor(dandy=null) {
    this.socket = null
    this._service_id = null
    this.debug_verbose = false

    if (dandy !== null) {
      const service_widget = dandy.service_widget = dandy.find_widget(DandyNames.SERVICE_ID)
      service_widget.serializeValue = async () => {
        this.warn_log(`Serializing service_id...`)
        return await this.get_service_id()
      }
    }

    connectWebSocket()
      .then((socket) => {
        this.socket = socket
        socket.addEventListener('message', (event) => {
          this.debug_log('recv: ', event.data.slice(0, 200))
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

          if (command === 'delivering_fonts') {
            const { fonts } = response 
            this.on_delivering_fonts(fonts)
          }

          if (command === 'sending_input') {
            this.on_sending_input(response)
          }
          
        })
        
        this.send({ 'command': 'get_service_id' })
      })
      .catch((error) => {
          this.error_log("Failed to establish WebSocket connection:", error)
      })

    this.on_request_captures = (o) => {
      this.warn_log("default on_request_captures()")
    }

    this.on_request_string = (o) => {
      this.warn_log("default on_request_string()")
    }

    this.on_sending_input = (o) => {
      this.warn_log("default on_sending_input()")
    }

    this.on_delivering_fonts = (fonts) => {
      this.warn_log("default on_delivering_fonts()")
    }

    this.on_delivering_images = () => {
      this.warn_log("default on_delivering_images()")
    }

    this.on_delivering_masks = () => {
      this.warn_log("default on_delivering_masks()")
    }
  }

  send(o) {
    this.debug_log('send: ' + JSON.stringify(o))//.slice(0, 80))
    this.socket.send(JSON.stringify(o))
  }

  async wait_until_up() {
    for (let i = 1; this._service_id === null; ++i) {
      const ms = 10 * i
      const ten_sec = 1000
      if (i === ten_sec) {
        this.error_log("DandySocket isn't getting its service_id...")
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

  thanks(py_client, output) {
    this.send({ 'command': 'thanks', 'py_client': py_client, 'output': output })
  }

  request_fonts() {
    this.send({ 'command': 'request_fonts' })
  }

  deliver_string(o) {
    o.command = 'delivering_string'
    this.send(o)
  }

}
