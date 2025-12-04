const express = require('express')
const router = express.Router()
const user = require('../controllers/user.js')

router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

router.post('/login', user.login)
router.post('/register', user.newUser)

module.exports = router
