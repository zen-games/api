require(`babel-core/register`)

let app = require(`express`)()
let http = require(`http`).Server(app)
let io = require(`socket.io`)(http)
let chalk = require(`chalk`)
let Sentencer = require(`sentencer`)

// Game Logic

import ttt from './games/tictactoe'

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
        x => x.users = x.users.filter(x => x.username !== username)
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
        users: [{ username }],
        messages: [],
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
      { username }
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
      room.users = room.users.filter(x => x.username !== username)

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
      x => x.users = x.users.filter(x => x.username !== username)
    )

    rooms = rooms.filter(x => x.users.length)

    socket.broadcast.emit(`api:updateRooms`, { rooms })

    console.log(chalk.magenta(
      `${username} has logged out. Number of rooms: ${rooms.length}`
    ))
  })

  socket.on(`ui:sendMessage`, ({ id, message, username }) => {
    let room = rooms.filter(x => x.id === id)[0]

    room.messages = [
      ...room.messages,
      {
        message,
        time: +new Date(),
        username
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
      ...game,
      started: false,
      turn: null,
      winner: null
    }

    rooms = [
      ...rooms.filter(x => x.id !== id),
      room
    ]

    io.emit(`api:updateRooms`, { rooms })

    console.log(chalk.white(
      `Room ${id} is now playing ${game.name}.`
    ))
  })

  socket.on(`ui:startGame`, ({ id, username }) => {
    let room = rooms.filter(x => x.id === id)[0]
    let user = room.users.filter(x => x.username === username)[0]

    user.ready = true

    room.users = [
      ...room.users.filter(x => x.username !== username),
      user
    ]

    if (room.users.filter(x => x.ready).length === room.game.players) {
      room.game.started = true

      room.game.turn =
        room.users[
          Math.floor(Math.random() * 2)
        ].username

      room.messages = [
        ...room.messages,
        {
          id: room.id,
          message: `The game has started!`,
          time: +new Date(),
          username: `zen-games`,
        }
      ]

      console.log(chalk.green(
        `${room.game.name} in ${room.id} has started!`
      ))
    }

    rooms = [
      ...rooms.filter(x => x.id !== id),
      room
    ]

    io.emit(`api:updateRooms`, { rooms })
  })

  socket.on(`ui:makeMove`, ({ id, x, y }) => {
    // TODO: check that the correct user made the move

    let room = rooms.filter(x => x.id === id)[0]
    let { game } = room

    game.state = [
      ...game.state,
      game.state[game.state.length -1].map((row, i) => {
        if (i === x) {
          return row.map((cell, i) => {
            if (i === y) {
              return game.state.length % 2 === 0 ? 1 : -1
            } else {
              return cell
            }
          })
        } else {
          return row
        }
      })
    ]

    if (game.state.length > 5) {
      ttt(game.state[game.state.length - 1], 3)

      room.messages = [
        ...room.messages,
        {
          id: room.id,
          message: `${game.turn} has won!`,
          time: +new Date(),
          username: `zen-games`,
        }
      ]

      game.winner = game.turn

      console.log(chalk.yellow(
        `${game.turn} has won ${room.game.name} in room ${room.id}!`
      ))
    }

    game.turn =
      room.users.filter(x => x.username !== game.turn)[0].username

    room.game = game

    rooms = [
      ...rooms.filter(x => x.id !== id),
      room
    ]

    io.emit(`api:updateRooms`, { rooms })
  })
})

http.listen(8000, () => {
  console.log(chalk.white(`☆ listening on localhost:8000`))
})
