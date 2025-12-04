const express = require('express')
const router = express.Router()
const groups = require('../controllers/groups.js')
const { authenticate } = require('../middleware/auth.js')

router.get('/api/mygroups', authenticate, groups.listOwnedGroups)
router.post('/api/mygroups', authenticate, groups.createGroup)
router.get('/api/mygroups/:gid', authenticate, groups.listGroupMembers)
router.delete('/api/mygroups/:gid', authenticate, groups.deleteGroup)
router.put('/api/mygroups/:gid/:uid', authenticate, groups.addMember)
router.delete('/api/mygroups/:gid/:uid', authenticate, groups.removeMember)
router.get('/api/groupsmember', authenticate, groups.listMemberGroups)

module.exports = router
