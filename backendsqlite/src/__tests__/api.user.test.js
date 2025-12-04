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

async function createGroupHelper (token, overrides = {}) {
  uniqueCounter += 1
  const name = overrides.name || `Group_${uniqueCounter}`
  const response = await request(app)
    .post('/api/mygroups')
    .set('x-access-token', token)
    .send({ name })
  expect(response.statusCode).toBe(200)
  return response.body.data.id
}

async function addMemberHelper (token, groupId, userId, expectedStatus = 200) {
  const response = await request(app)
    .put(`/api/mygroups/${groupId}/${userId}`)
    .set('x-access-token', token)
  expect(response.statusCode).toBe(expectedStatus)
  return response
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

describe('Groups API (niveau 4.4)', () => {
  test('owner can create groups and list them', async () => {
    const ownerToken = await loginAndGetToken()
    const groupId = await createGroupHelper(ownerToken)
    const response = await request(app)
      .get('/api/mygroups')
      .set('x-access-token', ownerToken)
    expect(response.statusCode).toBe(200)
    expect(response.body.data.some(group => group.id === groupId)).toBe(true)
    const adminToken = await loginAndGetToken(adminUser)
    const adminResponse = await request(app)
      .get('/api/mygroups')
      .set('x-access-token', adminToken)
    expect(adminResponse.statusCode).toBe(200)
    expect(adminResponse.body.data.find(group => group.id === groupId)).toBeDefined()
  })

  test('owner can add a member and members can list their groups', async () => {
    const ownerToken = await loginAndGetToken()
    const newUser = await registerUser()
    const newUserId = await findUserIdByEmail(ownerToken, newUser.email)
    const groupId = await createGroupHelper(ownerToken)
    const addResponse = await request(app)
      .put(`/api/mygroups/${groupId}/${newUserId}`)
      .set('x-access-token', ownerToken)
    expect(addResponse.statusCode).toBe(200)
    const memberToken = await loginAndGetToken({ email: newUser.email, password: newUser.password })
    const groupsResponse = await request(app)
      .get('/api/groupsmember')
      .set('x-access-token', memberToken)
    expect(groupsResponse.statusCode).toBe(200)
    expect(groupsResponse.body.data.some(group => group.id === groupId)).toBe(true)
    const membersList = await request(app)
      .get(`/api/mygroups/${groupId}`)
      .set('x-access-token', memberToken)
    expect(membersList.statusCode).toBe(200)
    expect(membersList.body.data.some(user => user.email === newUser.email)).toBe(true)
    const removeResponse = await request(app)
      .delete(`/api/mygroups/${groupId}/${newUserId}`)
      .set('x-access-token', memberToken)
    expect(removeResponse.statusCode).toBe(200)
    const afterGroups = await request(app)
      .get('/api/groupsmember')
      .set('x-access-token', memberToken)
    expect(afterGroups.body.data.find(group => group.id === groupId)).toBeUndefined()
  })

  test('admin can delete a group created by another user', async () => {
    const ownerToken = await loginAndGetToken()
    const adminToken = await loginAndGetToken(adminUser)
    const groupId = await createGroupHelper(ownerToken, { name: `Temp_${Date.now()}` })
    const response = await request(app)
      .delete(`/api/mygroups/${groupId}`)
      .set('x-access-token', adminToken)
    expect(response.statusCode).toBe(200)
    const ownerGroups = await request(app)
      .get('/api/mygroups')
      .set('x-access-token', ownerToken)
    expect(ownerGroups.body.data.find(group => group.id === groupId)).toBeUndefined()
  })

  test('group members can post and list messages', async () => {
    const ownerToken = await loginAndGetToken()
    const member = await registerUser()
    const memberToken = await loginAndGetToken({ email: member.email, password: member.password })
    const memberId = await findUserIdByEmail(ownerToken, member.email)
    const groupId = await createGroupHelper(ownerToken)
    await addMemberHelper(ownerToken, groupId, memberId)
    const postResponse = await request(app)
      .post(`/api/messages/${groupId}`)
      .set('x-access-token', memberToken)
      .send({ content: 'Bonjour à tous' })
    expect(postResponse.statusCode).toBe(200)
    const listResponse = await request(app)
      .get(`/api/messages/${groupId}`)
      .set('x-access-token', memberToken)
    expect(listResponse.statusCode).toBe(200)
    expect(listResponse.body.data.some(msg => msg.content === 'Bonjour à tous')).toBe(true)
  })

  test('non member cannot read or post messages', async () => {
    const ownerToken = await loginAndGetToken()
    const outsider = await registerUser({ email: uniqueEmail('outsider') })
    const outsiderToken = await loginAndGetToken({ email: outsider.email, password: outsider.password })
    const groupId = await createGroupHelper(ownerToken)
    const forbiddenList = await request(app)
      .get(`/api/messages/${groupId}`)
      .set('x-access-token', outsiderToken)
    expect(forbiddenList.statusCode).toBe(403)
    const forbiddenPost = await request(app)
      .post(`/api/messages/${groupId}`)
      .set('x-access-token', outsiderToken)
      .send({ content: 'Je ne devrais pas poster' })
    expect(forbiddenPost.statusCode).toBe(403)
  })
})
