const express = require('express')
const router = express.Router()
const user = require('../controllers/user.js')
const { authenticate } = require('../middleware/auth.js')

router.get('/users', authenticate, user.getUsers)
router.put('/users/:id', authenticate, user.updateUser)
router.delete('/users/:id', authenticate, user.deleteUser)

module.exports = router
