require(`babel-core/register`)

let app = require(`express`)()
let http = require(`http`).Server(app)
let io = require(`socket.io`)(http)
let chalk = require(`chalk`)
let Sentencer = require(`sentencer`)

// Chalk Colors

let CONNECT = `yellow`
let DISCONNECT = `red`
let LEAVE = `magenta`
let CREATE = `cyan`
let JOIN = `green`
let UPDATE = `white`

// "Database"

let rooms = []
let users = []

io.on(`connection`, (socket) => {
  users = [
    ...users,
    {
      id: socket.id
    }
  ]

  console.log(chalk[CONNECT](
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

    console.log(chalk[DISCONNECT](
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

    console.log(chalk[CREATE](
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

    console.log(chalk[JOIN](
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

      console.log(chalk[LEAVE](
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

    console.log(chalk[CREATE](
      `New user, ${username}, has logged in. Number of users: ${users.length}`
    ))
  })

  socket.on(`ui:logout`, ({ username }) => {
    rooms.forEach(
      x => x.users = x.users.filter(x => x !== username)
    )

    rooms = rooms.filter(x => x.users.length)

    console.log(chalk[LOGOUT](
      `${username} has logged out. Number of rooms: ${rooms.length}`
    ))
  })

  socket.on(`ui:sendMessage`, ({ id, message, username }) => {
    let room = rooms.filter(x => x.id === id)[0]

    room.messages = [
      ...room.messages,
      {
        username,
        message,
        time: +new Date()
      }
    ]

    rooms = [
      ...rooms.filter(x => x.id !== room.id),
      room
    ]

    io.emit(`api:updateRooms`, { rooms })
  })

  socket.on(`ui:setGame`, ({ game, id }) => {
    let room = rooms.filter(x => x.id === id)[0]

    room.game = {
      name: game,
      started: false,
      gameOver: false,
      turn: null
    }

    rooms = [
      ...rooms.filter(x => x.id !== id),
      room
    ]

    io.emit(`api:updateRooms`, { rooms })

    console.log(chalk[UPDATE](
      `Room ${id} is now playing ${game}.`
    ))
  })

  socket.on(`ui:startGame`, ({ id, username }) => {
    let room = rooms.filter(x => x.id === id)[0]

    // needs stage-0

    // room.game = {
    //   ...room.game,
    //   started: true,
    //   turn: username
    // }

    room.game.started = true
    room.game.turn = username

    rooms = [
      ...rooms.filter(x => x.id !== id),
      room
    ]

    io.emit(`api:updateRooms`, { rooms })

    console.log(chalk[UPDATE](
      `${room.game.name} in ${room.id} has started!`
    ))
  })
})

http.listen(8000, () => {
  console.log(chalk[UPDATE](`☆ listening on localhost:8000`))
})
