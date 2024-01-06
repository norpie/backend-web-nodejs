function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function limitOffset(req) {
  return [
    clamp(parseInt(req.query.limit) || 10, 0, 20),
    Math.max(parseInt(req.query.offset) || 0, 0),
  ];
}

module.exports = {
  limitOffset,
};
