const Sequelize = require('sequelize')
const db = require('./database.js')
const users = require('./users.js')
const groups = require('./groups.js')

const groupMembers = db.define('group_members', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: groups,
      key: 'id'
    }
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: users,
      key: 'id'
    }
  }
}, {
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['groupId', 'userId']
    }
  ]
})

groupMembers.belongsTo(groups, { foreignKey: 'groupId', onDelete: 'CASCADE' })
groupMembers.belongsTo(users, { foreignKey: 'userId', onDelete: 'CASCADE' })
groups.belongsToMany(users, { through: groupMembers, foreignKey: 'groupId', otherKey: 'userId', as: 'members' })
users.belongsToMany(groups, { through: groupMembers, foreignKey: 'userId', otherKey: 'groupId', as: 'memberGroups' })

module.exports = groupMembers
