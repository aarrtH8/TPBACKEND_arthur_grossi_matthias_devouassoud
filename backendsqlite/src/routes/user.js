const express = require('express')
const router = express.Router()
const user = require('../controllers/user.js')
const { authenticate, requireAdmin } = require('../middleware/auth.js')

router.get('/api/users', authenticate, user.getUsers)
router.put('/api/password', authenticate, user.updatePassword)
router.put('/api/users/:id', authenticate, requireAdmin, user.updateUser)
router.delete('/api/users/:id', authenticate, requireAdmin, user.deleteUser)

module.exports = router
