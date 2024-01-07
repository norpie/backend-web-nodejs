var express = require("express");
var router = express.Router();
const validator = require("email-validator");
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { limitOffset, getSecret, userId } = require("../utils");
const { getConnection } = require("../db");

/* GET users and users?username=ssalfh */
router.get("/", async function (req, res) {
  const [limit, offset] = limitOffset(req);
  const connection = await getConnection();
  let query = {
    text: "SELECT * FROM users LIMIT $1 OFFSET $2",
    values: [limit, offset],
  };
  if (req.query.username) {
    query = {
      text: "SELECT * FROM users WHERE SIMILARITY(username, $1) > 0.4 ORDER BY SIMILARITY(username, $1) DESC LIMIT $2 OFFSET $3",
      values: [req.query.username, limit, offset],
    };
  }
  const result = await connection.query(query);
  let users = result.rows;
  for (let i = 0; i < users.length; i++) {
    delete users[i].email;
    delete users[i].password;
  }
  return res.json(users);
});

/* POST users/ */
router.post("/", async function (req, res, next) {
  if (!req.body.username || !req.body.email || !req.body.password || !req.body.dob) {
    Promise.resolve().then(() => {
      throw new Error("Missing required field(s)");
    }).catch(next);
    return;
  }
  const connection = await getConnection();
  const password = await argon2.hash(req.body.password);
  if (!validator.validate(req.body.email)) {
    Promise.resolve().then(() => {
      throw new Error("Invalid email");
    }).catch(next);
    return;
  }
  const query = {
    text: "INSERT INTO users (username, email, password, dob, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *",
    values: [req.body.username, req.body.email, password, req.body.dob],
  };
  const result = await connection.query(query);
  if (result.rowCount === 0) {
    Promise.resolve().then(() => {
      throw new Error("Unable to create user. Internal error");
    }).catch(next);
    return;
  }
  const newUser = result.rows[0];
  delete newUser.email;
  delete newUser.password;
  return res.json(newUser);
});

/* GET users/id/:id */
router.get("/id/:id", async function (req, res, next) {
  let token;
  try {
    token = await userId(req);
  } catch (err) {
    Promise.resolve().then(() => {
      throw new Error("Invalid token");
    }).catch(next);
  }
  if (!token) {
    Promise.resolve().then(() => {
      throw new Error("Invalid token");
    }).catch(next);
    return;
  }
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    Promise.resolve().then(() => {
      throw new Error("Invalid user id");
    }).catch(next);
    return;
  }
  const connection = await getConnection();
  const query = {
    text: "SELECT * FROM users WHERE id = $1",
    values: [id],
  };
  const result = await connection.query(query);
  if (result.rows.length === 0) {
    Promise.resolve().then(() => {
      throw new Error("User not found");
    }).catch(next);
    return;
  }
  const user = result.rows[0];
  delete user.email;
  delete user.password;
  return res.json(user);
});

/* GET users/username/:username */
router.get("/username/:username", async function (req, res, next) {
  const username = req.params.username;
  const connection = await getConnection();
  const query = {
    text: "SELECT * FROM users WHERE username = $1",
    values: [username],
  };
  const result = await connection.query(query);
  if (result.rows.length === 0) {
    Promise.resolve().then(() => {
      throw new Error("User not found");
    }).catch(next);
    return;
  }
  const user = result.rows[0];
  delete user.email;
  delete user.password;
  return res.json(user);
});

/* POST users/login */
router.post("/login", async function (req, res, next) {
  if (!req.body.password || (!req.body.username && !req.body.email)) {
    Promise.resolve().then(() => {
      throw new Error("Missing required field(s)");
    }).catch(next);
    return;
  }
  const connection = await getConnection();
  let query = {
    text: "SELECT * FROM users WHERE username = $1 OR email = $2",
    values: [req.body.username, req.body.email],
  };
  let result = await connection.query(query);
  if (result.rows.length === 0) {
    Promise.resolve().then(() => {
      throw new Error("User not found");
    }).catch(next);
    return;
  }
  const user = result.rows[0];
  const valid = await argon2.verify(user.password, req.body.password);
  if (!valid) {
    Promise.resolve().then(() => {
      throw new Error("Invalid password");
    }).catch(next);
    return;
  }
  // Create api_session and Generate JWT
  query = {
    text: "INSERT INTO api_sessions (id, user_id, expiry) VALUES (uuid_generate_v4(), $1, NOW() + INTERVAL '7 day') RETURNING *",
    values: [user.id],
  };
  result = await connection.query(query);
  if (result.rowCount === 0) {
    Promise.resolve().then(() => {
      throw new Error("Unable to create session. Internal error");
    }).catch(next);
    return;
  }
  session = result.rows[0];
  const token = jwt.sign({ id: session.id }, getSecret(), { expiresIn: "7d" });
  delete user.email;
  delete user.password;
  return res.json({ token });
});

/* PUT users/:id */
router.put("/:id", async function (req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    Promise.resolve().then(() => {
      throw new Error("Invalid user id");
    }).catch(next);
    return;
  }
  const connection = await getConnection();
  let result = await connection.query({
    text: "SELECT * FROM users WHERE id = $1",
    values: [id],
  });
  if (result.rows.length === 0) {
    Promise.resolve().then(() => {
      throw new Error("User not found");
    }).catch(next);
    return;
  }
  const old = result.rows[0];
  const password = await argon2.hash(req.body.password || old.password);
  if (req.body.email && !validator.validate(req.body.email)) {
    Promise.resolve().then(() => {
      throw new Error("Invalid email");
    }).catch(next);
    return;
  }
  const query = {
    text: "UPDATE users SET username = $1, email = $2, password = $3, updated_at = NOW() WHERE id = $4 RETURNING *",
    values: [
      req.body.username || old.username,
      req.body.email || old.email,
      password,
      id,
    ],
  };
  result = await connection.query(query);
  if (result.rowCount === 0) {
    Promise.resolve().then(() => {
      throw new Error("User not found");
    }).catch(next);
    return;
  }
  const newUser = result.rows[0];
  delete user.email;
  delete user.password;
  return res.json(newUser);
});

/* DELETE users/:id */
router.delete("/:id", async function (req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    Promise.resolve().then(() => {
      throw new Error("Invalid user id");
    }).catch(next);
    return;
  }
  const connection = await getConnection();
  const query = {
    text: "DELETE FROM users WHERE id = $1",
    values: [id],
  };
  const result = await connection.query(query);
  if (result.rowCount === 0) {
    Promise.resolve().then(() => {
      throw new Error("User not found");
    }).catch(next);
    return;
  }
  return res.json({ message: "User deleted successfully" });
});

module.exports = router;
