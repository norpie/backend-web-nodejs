const jwt = require('jsonwebtoken');
const { getConnection } = require('./db');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function limitOffset(req) {
  return [
    clamp(parseInt(req.query.limit) || 10, 0, 20),
    Math.max(parseInt(req.query.offset) || 0, 0),
  ];
}

require('dotenv').config();

function getSecret() {
  return process.env.API_SECRET;
}

async function userId(req) {
  const token = req.headers['authorization'];
  console.log(req.headers);
  if (!token) {
    throw new Error('No token provided');
  }
  const secret = getSecret();
  const decoded = await jwt.verify(token, secret);
  if (!decoded) {
    throw new Error('Invalid token');
  }
  const query = {
    text: 'SELECT * FROM api_sessions WHERE id = $1',
    values: [decoded.id],
  };
  const connection = await getConnection();
  const result = await connection.query(query);
  if (result.rows.length === 0) {
    throw new Error('Invalid token');
  }
  const session = result.rows[0];
  return session.user_id;
}

module.exports = {
  limitOffset,
  getSecret,
  userId,
};
