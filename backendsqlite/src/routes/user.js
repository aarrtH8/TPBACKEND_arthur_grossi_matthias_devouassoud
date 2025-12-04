const express = require('express')
const router = express.Router()
const user = require('../controllers/user.js')
const { authenticate, requireAdmin } = require('../middleware/auth.js')

router.get('/users', authenticate, user.getUsers)
router.put('/password', authenticate, user.updatePassword)
router.put('/users/:id', authenticate, requireAdmin, user.updateUser)
router.delete('/users/:id', authenticate, requireAdmin, user.deleteUser)

module.exports = router
