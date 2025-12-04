const app = require('../app')
const request = require('supertest')

const baseUser = { email: 'matt_art@gmail.com', password: '123456' }
const adminUser = { email: 'admin@example.com', password: 'Adm1nP@ss!' }
let uniqueCounter = 0

function uniqueEmail (prefix = 'user') {
  uniqueCounter += 1
  return `${prefix}_${Date.now()}_${uniqueCounter}@example.com`
}

async function loginAndGetToken (credentials = baseUser) {
  const response = await request(app).post('/login').send(credentials)
  expect(response.statusCode).toBe(200)
  expect(response.body).toHaveProperty('token')
  return response.body.token
}

async function registerUser (overrides = {}) {
  const letter = String.fromCharCode(65 + (uniqueCounter % 26))
  const payload = {
    name: overrides.name || `User_${letter}`,
    email: overrides.email || uniqueEmail(),
    password: overrides.password || 'Str0ngP@ss!'
  }
  const response = await request(app).post('/register').send(payload)
  expect(response.statusCode).toBe(200)
  return payload
}

async function listUsers (token) {
  const response = await request(app)
    .get('/api/users')
    .set('x-access-token', token)
  expect(response.statusCode).toBe(200)
  return response.body.data
}

async function findUserIdByEmail (token, email) {
  const users = await listUsers(token)
  const target = users.find(u => u.email === email)
  expect(target).toBeDefined()
  return target.id
}

describe('Users API (niveaux 4.2 & 4.3)', () => {
  test('Mat_Art can log in and list users with a valid token', async () => {
    const token = await loginAndGetToken()
    const response = await request(app)
      .get('/api/users')
      .set('x-access-token', token)
    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('Returning users')
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBeGreaterThan(0)
  })

  test('should refuse login with wrong password', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: baseUser.email, password: 'badPass123!' })
    expect(response.statusCode).toBe(403)
    expect(response.body.status).toBe(false)
  })

  test('should block listing users without token', async () => {
    const response = await request(app).get('/api/users')
    expect(response.statusCode).toBe(401)
  })

  test('should block listing users with forged token', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('x-access-token', 'invalid.token.value')
    expect(response.statusCode).toBe(401)
  })

  test('should refuse registration if password is weak', async () => {
    const response = await request(app)
      .post('/register')
      .send({ name: 'Weakie', email: 'weak@example.com', password: 'aaaaaaa' })
    expect(response.statusCode).toBe(400)
  })

  test('should register a new user and allow them to fetch the list', async () => {
    const uniqueEmail = `user_${Date.now()}@example.com`
    const registerResponse = await request(app)
      .post('/register')
      .send({ name: 'Nouveau', email: uniqueEmail, password: 'Str0ngP@ss!' })
    expect(registerResponse.statusCode).toBe(200)
    const token = await loginAndGetToken({ email: uniqueEmail, password: 'Str0ngP@ss!' })
    const listResponse = await request(app)
      .get('/api/users')
      .set('x-access-token', token)
    expect(listResponse.statusCode).toBe(200)
  })

  test('user can change their password via /api/password', async () => {
    const newUser = await registerUser()
    const token = await loginAndGetToken({ email: newUser.email, password: newUser.password })
    const newPassword = 'N3wP@ssword!'
    const changeResponse = await request(app)
      .put('/api/password')
      .set('x-access-token', token)
      .send({ password: newPassword })
    expect(changeResponse.statusCode).toBe(200)
    const oldLogin = await request(app).post('/login').send({ email: newUser.email, password: newUser.password })
    expect(oldLogin.statusCode).toBe(403)
    const newLogin = await request(app).post('/login').send({ email: newUser.email, password: newPassword })
    expect(newLogin.statusCode).toBe(200)
  })

  test('non admin cannot update another user', async () => {
    const token = await loginAndGetToken()
    const response = await request(app)
      .put('/api/users/1')
      .set('x-access-token', token)
      .send({ name: 'Should fail' })
    expect(response.statusCode).toBe(403)
  })

  test('admin can update the name of a user', async () => {
    const adminToken = await loginAndGetToken(adminUser)
    const targetUser = await registerUser()
    const targetId = await findUserIdByEmail(adminToken, targetUser.email)
    const response = await request(app)
      .put(`/api/users/${targetId}`)
      .set('x-access-token', adminToken)
      .send({ name: 'Updated Name', isAdmin: true })
    expect(response.statusCode).toBe(200)
    const updatedUsers = await listUsers(adminToken)
    const updated = updatedUsers.find(u => u.id === targetId)
    expect(updated).toBeDefined()
    expect(updated.name).toBe('Updated Name')
  })

  test('admin can delete a user', async () => {
    const adminToken = await loginAndGetToken(adminUser)
    const targetUser = await registerUser({ email: uniqueEmail('delete') })
    const targetId = await findUserIdByEmail(adminToken, targetUser.email)
    const response = await request(app)
      .delete(`/api/users/${targetId}`)
      .set('x-access-token', adminToken)
    expect(response.statusCode).toBe(200)
    const usersAfter = await listUsers(adminToken)
    expect(usersAfter.find(u => u.email === targetUser.email)).toBeUndefined()
  })
})
