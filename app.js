require(`babel-core/register`)

var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

var users = []
var rooms = []

app.get(`/`, (req, res) => {
  res.sendfile(`test.html`  )
})

io.on(`connection`, (socket) => {
  console.log(`connected`)
  socket.on(`disconnect`, () => {
    console.log(`disconnected`)
  })

  socket.on(`createUser`, (username) => {
    users.push(username)
    console.log(username)
    socket.broadcast.emit(`userCreated`, { users })
  })

  socket.on(`createRoom`, ({ room }) => {
    rooms = [ ...rooms, room ]
    socket.broadcast.emit(`roomCreated`, { rooms })
  })

  socket.on(`joinRoom`, (roomname) => {
    socket.broadcast.emit(`roomJoine`, { rooms })
  })
})

http.listen(8000, () => {
  console.log(`works`)
})
