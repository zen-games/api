let mongoose = require(`mongoose`)
let Schema = mongoose.Schema
let bcrypt = require(`bcrypt`)
const SALT_WORK_FACTOR = 10
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_TIME = 2 * 60 * 60 * 1000

let UserSchema = new Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number }
})

UserSchema.virtual('isLocked').get(() => !!(this.lockUntil && this.lockUntil > Date.now())) // check for a future lockUntil timestamp

UserSchema.pre(`save`, next => {
  let user = this
  // only hash the password if it has been modified (or is new)
  if (!user.isModified(`password`)) return next()
  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err)
    // hash the password using our new salt
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err)
      // override the cleartext password with the hashed one
      user.password = hash
      next()
    })
  })
})

UserSchema.methods.comparePassword = (candidatePassword, cb) => {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return cb(err)
    cb(null, isMatch)
  })
}

UserSchema.methods.incLoginAttempts = cb => {
    // if we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        }, cb)
    }
    // otherwise we're incrementing
    var updates = { $inc: { loginAttempts: 1 } }
    // lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + LOCK_TIME }
    }
    return this.update(updates, cb)
}

var reasons = UserSchema.statics.failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
}


UserSchema.statics.getAuthenticated = (username, password, cb) => {
  this.findOne({ username: username }, (err, user) => {
    if (err) return cb(err);
        // make sure the user exists
      if (!user) {
        return cb(null, null, reasons.NOT_FOUND)
      }
      // check if the account is currently locked
      if (user.isLocked) {
        // just increment login attempts if account is already locked
        return user.incLoginAttempts((err) => {
          if (err) return cb(err)
          return cb(null, null, reasons.MAX_ATTEMPTS)
        })
      }
      // test for a matching password
      user.comparePassword(password, (err, isMatch) => {
        if (err) return cb(err)
          // check if the password was a match
          if (isMatch) {
            // if there's no lock or failed attempts, just return the user
            if (!user.loginAttempts && !user.lockUntil) return cb(null, user);
            // reset attempts and lock info
            var updates = {
                $set: { loginAttempts: 0 },
                $unset: { lockUntil: 1 }
            }
            return user.update(updates, (err) => {
                if (err) return cb(err)
                return cb(null, user)
            });
          }
          // password is incorrect, so increment login attempts before responding
          user.incLoginAttempts((err) => {
            if (err) return cb(err)
            return cb(null, null, reasons.PASSWORD_INCORRECT)
          })
      })
  })
}

module.exports = mongoose.model(`User`, UserSchema)
