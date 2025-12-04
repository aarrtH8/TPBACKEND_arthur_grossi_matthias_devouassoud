const express = require('express')
const router = express.Router()
const messages = require('../controllers/messages.js')
const { authenticate } = require('../middleware/auth.js')

router.get('/api/messages/:gid', authenticate, messages.listMessages)
router.post('/api/messages/:gid', authenticate, messages.addMessage)

module.exports = router
