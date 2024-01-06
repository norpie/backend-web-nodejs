var express = require("express");
var router = express.Router();
const { limitOffset } = require("../utils");
const { getConnection } = require("../db");
const argon2 = require('argon2');

/* GET users/ */
router.get("/", async function (req, res) {
  const [limit, offset] = limitOffset(req);
  const connection = await getConnection();
  const query = {
    text: "SELECT * FROM users LIMIT $1 OFFSET $2",
    values: [limit, offset],
  };
  const result = await connection.query(query);
  const users = result.rows;
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
  return res.json(newUser);
});

/* GET users/:id */
router.get("/:id", async function (req, res, next) {
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
  return res.json(user);
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
  const query = {
    text: "UPDATE users SET username = $1, email = $2, password = $3 WHERE id = $4 RETURNING *",
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
