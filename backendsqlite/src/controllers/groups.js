const status = require('http-status')
const has = require('has-keys')
const CodeError = require('../util/CodeError.js')
const groupModel = require('../models/groups.js')
const groupMembersModel = require('../models/groupMembers.js')
const userModel = require('../models/users.js')

async function groupById (gid) {
  const group = await groupModel.findByPk(gid)
  if (!group) throw new CodeError('Group not found', status.NOT_FOUND)
  return group
}

async function userById (uid) {
  const user = await userModel.findByPk(uid)
  if (!user) throw new CodeError('User not found', status.NOT_FOUND)
  return user
}

async function isMember (groupId, userId) {
  const membership = await groupMembersModel.findOne({ where: { groupId, userId } })
  return Boolean(membership)
}

function canManageGroup (group, user) {
  return user.isAdmin || group.ownerId === user.id
}

async function assertCanListMembers (group, user) {
  if (user.isAdmin || group.ownerId === user.id) return
  if (await isMember(group.id, user.id)) return
  throw new CodeError('Forbidden', status.FORBIDDEN)
}

async function assertCanAddOrRemove (group, targetUserId, user, action) {
  if (user.isAdmin || group.ownerId === user.id) return
  if (user.id === targetUserId && action === 'remove') return
  if (user.id === targetUserId && action === 'add') return
  throw new CodeError('Forbidden', status.FORBIDDEN)
}

module.exports = {
  async listOwnedGroups (req, res) {
    // #swagger.tags = ['Groups']
    // #swagger.summary = 'List groups created by the authenticated user (or all for admin)'
    const where = req.authUser.isAdmin ? {} : { ownerId: req.authUser.id }
    const data = await groupModel.findAll({
      where,
      attributes: ['id', 'name', 'ownerId'],
      include: { model: userModel, as: 'owner', attributes: ['id', 'name', 'email'] },
      order: [['id', 'ASC']]
    })
    res.json({ status: true, message: 'Returning owned groups', data })
  },
  async createGroup (req, res) {
    // #swagger.tags = ['Groups']
    // #swagger.summary = 'Create a new group owned by the authenticated user'
    if (!has(req.body, ['name'])) throw new CodeError('You must specify the name', status.BAD_REQUEST)
    const { name } = req.body
    const group = await groupModel.create({ name, ownerId: req.authUser.id })
    res.json({ status: true, message: 'Group created', data: { id: group.id, name: group.name } })
  },
  async listGroupMembers (req, res) {
    // #swagger.tags = ['Groups']
    // #swagger.summary = 'List members of a group'
    const group = await groupById(req.params.gid)
    await assertCanListMembers(group, req.authUser)
    const members = await groupMembersModel.findAll({
      where: { groupId: group.id },
      include: { model: userModel, attributes: ['id', 'name', 'email'] },
      order: [['id', 'ASC']]
    })
    res.json({
      status: true,
      message: 'Returning group members',
      data: members.map(member => member.user)
    })
  },
  async deleteGroup (req, res) {
    // #swagger.tags = ['Groups']
    // #swagger.summary = 'Delete a group (owner/admin)'
    const group = await groupById(req.params.gid)
    if (!canManageGroup(group, req.authUser)) throw new CodeError('Forbidden', status.FORBIDDEN)
    await group.destroy()
    res.json({ status: true, message: 'Group deleted' })
  },
  async addMember (req, res) {
    // #swagger.tags = ['Groups']
    // #swagger.summary = 'Add a user into a group'
    const group = await groupById(req.params.gid)
    const user = await userById(req.params.uid)
    await assertCanAddOrRemove(group, user.id, req.authUser, 'add')
    const [membership, created] = await groupMembersModel.findOrCreate({
      where: { groupId: group.id, userId: user.id }
    })
    if (!created) throw new CodeError('User already member of this group', status.BAD_REQUEST)
    res.json({ status: true, message: 'User added to group' })
  },
  async removeMember (req, res) {
    // #swagger.tags = ['Groups']
    // #swagger.summary = 'Remove a user from a group'
    const group = await groupById(req.params.gid)
    const user = await userById(req.params.uid)
    await assertCanAddOrRemove(group, user.id, req.authUser, 'remove')
    const deleted = await groupMembersModel.destroy({ where: { groupId: group.id, userId: user.id } })
    if (!deleted) throw new CodeError('Membership not found', status.NOT_FOUND)
    res.json({ status: true, message: 'User removed from group' })
  },
  async listMemberGroups (req, res) {
    // #swagger.tags = ['Groups']
    // #swagger.summary = 'List the groups where the authenticated user is a member'
    const memberships = await groupMembersModel.findAll({
      where: { userId: req.authUser.id },
      include: { model: groupModel, attributes: ['id', 'name', 'ownerId'] },
      order: [['id', 'ASC']]
    })
    res.json({
      status: true,
      message: 'Returning groups where user is member',
      data: memberships.map(membership => membership.group)
    })
  }
}
