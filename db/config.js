let mongoose = require(`mongoose`)

module.exports = () => {
  mongoose.connect(`mongodb://localhost/zen`)
  mongoose.connection.on(`connected`, () => console.log(`db connected`))
  mongoose.connection.on(`error`, err => console.error(err))
  mongoose.connection.on(`disconnected`, () => console.log(`db connection disconnected`))

  process.on(`SIGINT`, () => {
    mongoose.connection.close(() => {
      console.log(`connection disconnected through app termination`)
      process.exit(0)
    })
  })
}
