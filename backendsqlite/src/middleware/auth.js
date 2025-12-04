const status = require('http-status')
const jws = require('jws')
const userModel = require('../models/users.js')
const CodeError = require('../util/CodeError.js')

require('mandatoryenv').load(['TOKENSECRET'])
const { TOKENSECRET } = process.env

async function authenticate (req, res, next) {
  try {
    const token = req.headers['x-access-token']
    if (!token) throw new CodeError('Missing access token', status.UNAUTHORIZED)
    if (!jws.verify(token, 'HS256', TOKENSECRET)) throw new CodeError('Invalid token', status.UNAUTHORIZED)
    const decoded = jws.decode(token)
    const email = typeof decoded.payload === 'string' ? decoded.payload : decoded.payload.email
    const user = await userModel.findOne({ where: { email } })
    if (!user) throw new CodeError('User not found for provided token', status.UNAUTHORIZED)
    req.authUser = user
    return next()
  } catch (error) {
    return next(error)
  }
}

function requireAdmin (req, res, next) {
  if (!req.authUser || !req.authUser.isAdmin) {
    return next(new CodeError('Admin privileges required', status.FORBIDDEN))
  }
  return next()
}

module.exports = {
  authenticate,
  requireAdmin
}
