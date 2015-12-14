var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.get('/', (req, res) => {
  res.sendfile('test.html')
})

io.on('connection', (socket) => {
  console.log('connectedddd')
  socket.on('disconnet', () => {
    console.log('disconnected')
  })

  socket.on(`yoo`, () =>
    socket.broadcast.emit(`yo`, { message: `yo` })
  )
})

http.listen(8000, () => {
  console.log('works')
})
