const express = require('express')
const router = express.Router()
const groups = require('../controllers/groups.js')
const { authenticate } = require('../middleware/auth.js')

router.get('/mygroups', authenticate, groups.listOwnedGroups)
router.post('/mygroups', authenticate, groups.createGroup)
router.get('/mygroups/:gid', authenticate, groups.listGroupMembers)
router.delete('/mygroups/:gid', authenticate, groups.deleteGroup)
router.put('/mygroups/:gid/:uid', authenticate, groups.addMember)
router.delete('/mygroups/:gid/:uid', authenticate, groups.removeMember)
router.get('/groupsmember', authenticate, groups.listMemberGroups)

module.exports = router
