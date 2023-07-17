import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Socket is set')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {
      socket.on('item-change', msg => { 
        socket.broadcast.emit('update-item', msg)
      })
    })
  }
  else {
	console.log("Socket already established")
  }
  res.end()
}

export default SocketHandler