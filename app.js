require(`babel-core/register`)

let app = require(`express`)()
let http = require(`http`).Server(app)
let io = require(`socket.io`)(http)
let chalk = require(`chalk`)
let Sentencer = require(`sentencer`)
let mongoose = require(`mongoose`)
let routes = require(`express-routes`)
let jwt = require(`jsonwebtoken`)
let User = require (`./db/user`)
let db = require (`./db/config`)
let router = app.Router()

let rooms = []
let users = []

var testUser = new User({
  username: dongler,
  password: Password
})

User.findOne({ username: `dongler` }, (err, user) => {
  if (err) throw err
  // test a matching password
  user.comparePassword(`Password123`, (err, isMatch) => {
      if (err) throw err
      console.log(`Password123:`, isMatch); // > Password123: true
  })
  // test a failing password
  user.comparePassword(`123Password`, function(err, isMatch) {
      if (err) throw err;
      console.log(`123Password:`, isMatch); // > 123Password: false
  });
});

router.post(`/auth`, (req, res) => {

})

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
    if (users.some(x => x.username === username)) {
      socket.emit(`api:userExists`)
    }
    else {
      users = [
        ...users.filter(x => x.id !== socket.id),
        {
          id: socket.id,
          username
        }
      ]

      socket.emit(`api:login`)
      socket.emit(`api:updateRooms`, ({ rooms }))

      console.log(chalk.cyan(
        `New user, ${username}, has logged in. Number of users: ${users.length}`
      ))
    }
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

    console.log(chalk.white(
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

    console.log(chalk.green(
      `${room.game.name} in ${room.id} has started!`
    ))
  })
})

http.listen(8000, () => {
  console.log(chalk.white(`☆ listening on localhost:8000`))
})
