require(`babel-core/register`)

let app = require('express')()
let http = require('http').Server(app)
let io = require('socket.io')(http)
let chalk = require('chalk')

let rooms = []

io.on(`connection`, (socket) => {
  console.log(chalk.yellow(`⚡ New connection!`))

  socket.on(`disconnect`, () => {
    console.log(chalk.red(`⌧ User disconnected.`))
  })

  socket.on(`ui:createRoom`, ({ room }) => {
    rooms = [ ...rooms, room ]
    socket.broadcast.emit(`api:createRoom`, { room })

    console.log(chalk.cyan(
      `New room was created with id ${room.id}. Number of rooms: ${rooms.length}`
    ))
  })

  socket.on(`ui:joinRoom`, ({ id, username }) => {
    socket.broadcast.emit(`api:joinRoom`, { rooms })
    console.log(chalk.cyan(
      `${username} has joined room ${id}.`
    ))
  })

  socket.on(`ui:leaveRoom`, ({ id, username }) => {
    let room = rooms.filter(x => x.id === id)[0]

    if (room) {
      room.users = room.users.filter(x => x !== username)

      if (room.owner === username) {
        room.owner = null
      }

      rooms = [
        ...rooms.filter(x => x.id !== id),
        room
      ]

      rooms = rooms.filter(x => x.users.length)

      io.emit(`api:leaveRoom`, { rooms })

      console.log(chalk.magenta(
        `${username} has left room ${id}. Number of rooms: ${rooms.length}`
      ))
    }
  })

  socket.on(`ui:createUser`, ({ username }) => {
    socket.emit(`api:createUser`, ({ rooms }))
    console.log(chalk.cyan(`New user, ${username}, has logged in.`))
  })

  socket.on(`ui:logout`, ({ username }) => {
    rooms.forEach(x => x.users = x.users.filter(x => x !== username))
    rooms = rooms.filter(x => x.users.length)

    console.log(chalk.magenta(
      `${username} has logged out. Number of rooms: ${rooms.length}`
    ))
  })
})

http.listen(8000, () => {
  console.log(chalk.white(`☆ listening on localhost:8000`))
})
