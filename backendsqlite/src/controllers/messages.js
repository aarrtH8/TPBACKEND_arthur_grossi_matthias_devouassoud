const status = require('http-status')
const has = require('has-keys')
const CodeError = require('../util/CodeError.js')
const messagesModel = require('../models/messages.js')
const groupsModel = require('../models/groups.js')
const groupMembersModel = require('../models/groupMembers.js')
const usersModel = require('../models/users.js')

async function ensureGroupExists (groupId) {
  const group = await groupsModel.findByPk(groupId)
  if (!group) throw new CodeError('Group not found', status.NOT_FOUND)
  return group
}

async function isMember (groupId, userId) {
  if (!groupId || !userId) return false
  const member = await groupMembersModel.findOne({ where: { groupId, userId } })
  return Boolean(member)
}

async function ensureCanAccess (group, user) {
  if (user.isAdmin) return
  if (group.ownerId === user.id) return
  if (await isMember(group.id, user.id)) return
  throw new CodeError('Forbidden', status.FORBIDDEN)
}

module.exports = {
  async listMessages (req, res) {
    // #swagger.tags = ['Messages']
    // #swagger.summary = 'List all messages for a group'
    const group = await ensureGroupExists(req.params.gid)
    await ensureCanAccess(group, req.authUser)
    const rows = await messagesModel.findAll({
      where: { groupId: group.id },
      include: {
        model: usersModel,
        attributes: ['id', 'name', 'email']
      },
      order: [['createdAt', 'ASC']]
    })
    res.json({
      status: true,
      message: 'Returning group messages',
      data: rows.map(row => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt,
        author: row.user
      }))
    })
  },
  async addMessage (req, res) {
    // #swagger.tags = ['Messages']
    // #swagger.summary = 'Post a message to a group'
    const group = await ensureGroupExists(req.params.gid)
    if (!(await isMember(group.id, req.authUser.id)) && group.ownerId !== req.authUser.id && !req.authUser.isAdmin) {
      throw new CodeError('Forbidden', status.FORBIDDEN)
    }
    if (!has(req.body, ['content']) || typeof req.body.content !== 'string' || req.body.content.trim() === '') {
      throw new CodeError('You must specify the content', status.BAD_REQUEST)
    }
    const message = await messagesModel.create({
      groupId: group.id,
      userId: req.authUser.id,
      content: req.body.content.trim()
    })
    res.json({ status: true, message: 'Message added', data: { id: message.id } })
  }
}
