require(`babel-core/register`)

let app = require(`express`)()
let http = require(`http`).Server(app)
let io = require(`socket.io`)(http)
let chalk = require(`chalk`)
let Sentencer = require(`sentencer`)

let rooms = []
let users = []

io.on(`connection`, (socket) => {
  users = [
    ...users,
    {
      id: socket.id
    }
  ]

  console.log(chalk.yellow(
    `⚡ New connection!`
  ))

  socket.on(`disconnect`, () => {
    let { username } = users.filter(x => x.id === socket.id)[0]

    if (username) {
      rooms.forEach(
        x => x.users = x.users.filter(x => x !== username)
      )

      rooms = rooms.filter(x => x.users.length)
    }

    users = [
      ...users.filter(x => x.id !== socket.id)
    ]

    console.log(chalk.red(
      `⌧ User disconnected. Number of users: ${users.length}. `
    + `Number of rooms: ${rooms.length}`
    ))
  })

  socket.on(`ui:createRoom`, ({ username }) => {
    let id = Sentencer.make(`{{adjective}}-{{noun}}`)

    rooms = [
      ...rooms,
      {
        id,
        owner: username,
        users: [ username ],
        messages: []
      }
    ]

    socket.emit(`api:createRoom`, { id })
    io.emit(`api:updateRooms`, { rooms })

    console.log(chalk.cyan(
      `New room was created with id ${id}. Number of rooms: ${rooms.length}`
    ))
  })

  socket.on(`ui:joinRoom`, ({ id, username }) => {
    let room = rooms.filter(x => x.id === id)[0]

    room.users = [
      ...room.users,
      username
    ]

    rooms = [
      ...rooms.filter(x => x.id !== id),
      room
    ]

    io.emit(`api:updateRooms`, { rooms })

    console.log(chalk.green(
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

      io.emit(`api:updateRooms`, { rooms })

      console.log(chalk.magenta(
        `${username} has left room ${id}. Number of rooms: ${rooms.length}`
      ))
    }
  })

  socket.on(`ui:createUser`, ({ username }) => {
    users = [
      ...users.filter(x => x.id !== socket.id),
      {
        id: socket.id,
        username
      }
    ]

    socket.emit(`api:updateRooms`, ({ rooms }))

    console.log(chalk.cyan(
      `New user, ${username}, has logged in. Number of users: ${users.length}`
    ))
  })

  socket.on(`ui:logout`, ({ username }) => {
    rooms.forEach(
      x => x.users = x.users.filter(x => x !== username)
    )

    rooms = rooms.filter(x => x.users.length)

    console.log(chalk.magenta(
      `${username} has logged out. Number of rooms: ${rooms.length}`
    ))
  })

  socket.on(`ui:sendMessage`, ({ room }) => {
    rooms = [
      ...rooms.filter(x => x.id !== room.id),
      room
    ]

    io.emit(`api:updateRooms`, { rooms })
  })
})

http.listen(8000, () => {
  console.log(chalk.white(`☆ listening on localhost:8000`))
})
