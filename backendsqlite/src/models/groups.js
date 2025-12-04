const Sequelize = require('sequelize')
const db = require('./database.js')
const userModel = require('./users.js')

const groups = db.define('groups', {
  id: {
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(128),
    allowNull: false,
    validate: {
      len: [1, 128]
    }
  },
  ownerId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: userModel,
      key: 'id'
    }
  }
}, { timestamps: false })

groups.belongsTo(userModel, { as: 'owner', foreignKey: 'ownerId', onDelete: 'CASCADE' })

module.exports = groups
