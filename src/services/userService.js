const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const db = require('../config/db');

const SALT_ROUNDS = 10;

function createUser(email, password) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    throw new Error('Пользователь с таким email уже существует');
  }
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const id = nanoid();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    email.toLowerCase(),
    passwordHash,
    createdAt
  );
  return { id, email: email.toLowerCase(), createdAt };
}

function validateUser(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return null;
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return null;
  return { id: user.id, email: user.email, createdAt: user.created_at };
}

function findUserById(id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return null;
  return { id: user.id, email: user.email, createdAt: user.created_at };
}

module.exports = {
  createUser,
  validateUser,
  findUserById
};
