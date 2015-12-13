var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.get('/', function (req, res) {
  res.sendfile('test.html')
})

io.on('connection', function (socket) {
  console.log('connected')
  socket.on('disconnet', function () {
    console.log('disconnected')
  })
})

http.listen(80, function(){
  console.log('works')
})