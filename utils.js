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

module.exports = {
  limitOffset,
  getSecret,
};
