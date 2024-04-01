const DANDY_WS_PORT = 7872

export class DandySocket {
  constructor() {
    const socket = this.socket = new WebSocket(`ws://localhost:${DANDY_WS_PORT}`)
    this._service_id = null
    this._responsePromises = {}

    socket.addEventListener('open', (event) => {
      this.send({ 'command': 'get_service_id' })
    })
    
    socket.addEventListener('message', (event) => {
      console.log('DandyServices ::', event.data)
      const response = JSON.parse(event.data)
      const { command } = response
      
      if (command === 'set_service_id') {
        this._service_id = response.service_id
      }
    })
  }

  send(command) {
    this.socket.send(JSON.stringify(command))
  }

  async wait_until_up() {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    for (let i = 1; this._service_id === null; ++i) {
      const ms = 10 * i
      const hundred_sec = 10000 
      if (i === hundred_sec) {
        console.error("DandySocket isn't getting its service_id...")
        --i
      }
      await delay(ms)
    }
  }

  async get_service_id() {
    await this.wait_until_up()
    return this._service_id
  }

  async send_captures(b64captures) {
    this.send({ 'command': 'delivering_captures', 'captures': b64captures })
  }

}
