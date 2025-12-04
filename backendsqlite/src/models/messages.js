const Sequelize = require('sequelize')
const db = require('./database.js')
const users = require('./users.js')
const groups = require('./groups.js')

const messages = db.define('messages', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: users,
      key: 'id'
    }
  },
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: groups,
      key: 'id'
    }
  }
}, {
  timestamps: true
})

messages.belongsTo(users, { foreignKey: 'userId', onDelete: 'CASCADE' })
messages.belongsTo(groups, { foreignKey: 'groupId', onDelete: 'CASCADE' })
groups.hasMany(messages, { foreignKey: 'groupId', onDelete: 'CASCADE' })

module.exports = messages
