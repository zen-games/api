var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var users = []
var rooms = []

app.get('/', (req, res) => {
  res.sendfile('test.html')
})

io.on('connection', (socket) => {
  console.log('connected')
  console.log(socket)
  socket.on('disconnect', () => {
    console.log('disconnected')
  })

  socket.on(`createUser`, (username) => {
    users.push(username)
    socket.broadcast.emit('userCreated', { users })
  })

  socket.on(`createRoom`, (roomname) => {
    rooms.push(roomname)
    socket.broadcast.emit('roomCreated', { rooms })
  })

  socket.on(`joinRoom`, (roomname) => {
    socket.broadcast.emit('roomJoined', { rooms })
  })
})

http.listen(8090, () => {
  console.log('works')
})
