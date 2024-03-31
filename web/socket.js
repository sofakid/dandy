const DANDY_WS_PORT = 7872

export class DandySocket {
  constructor() {
    const socket = this.socket = new WebSocket(`ws://localhost:${DANDY_WS_PORT}`)
    console.warn("socket", socket)
    socket.addEventListener("open", (event) => {
      socket.send("Hello from JavaScript!")
    })
    
    socket.addEventListener("message", (event) => {
      console.log("Message from Python:", event.data)
    })
  }
}