require(`babel-core/register`)

let app = require('express')()
let http = require('http').Server(app)
let io = require('socket.io')(http)

let rooms = []

io.on(`connection`, (socket) => {
  console.log(`New connection!`)
  socket.on(`disconnect`, () => {
    console.log(`User disconnected.`)
  })

  socket.on(`ui:createRoom`, ({ room }) => {
    rooms = [ ...rooms, room ]
    socket.broadcast.emit(`api:createRoom`, { room })
  })

  socket.on(`ui:joinRoom`, (roomname) => {
    socket.broadcast.emit(`api:joinRoom`, { rooms })
  })

  socket.on(`ui:leaveRoom`, ({ id, username }) => {
    let room = rooms.filter(x => x.id === id)[0]
    room.users = room.users.filter(x => x !== username)

    if (room.owner === username) {
      room.owner = null
    }

    rooms = [
      ...rooms.filter(x => x.id !== id),
      room
    ].filter(x => x.users.length)


    io.emit(`api:leaveRoom`, { rooms })
  })

  socket.on(`ui:logout`, ({ username }) => {
    //TODO: remove username from all rooms
  })
})

http.listen(8000, () => {
  console.log(`listening on localhost:8000`)
})
