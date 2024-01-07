var express = require("express");
var router = express.Router();
const { limitOffset, userId } = require("../utils");
const { getConnection } = require("../db");

router.get("/", async function (req, res, next) {
  const { limit, offset } = limitOffset(req);
  const conn = await getConnection();
  const result = await conn.query(
    "SELECT * FROM ideas LIMIT $1 OFFSET $2",
    [limit, offset]
  );
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Internal error");
      })
      .catch(next);
    return;
  }
  const rows = result.rows;
  res.json(rows);
});

router.get("/:id", async function (req, res, next) {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid id");
      })
      .catch(next);
    return;
  }
  const conn = await getConnection();
  const result = await conn.query("SELECT * FROM ideas WHERE id = $1", [id]);
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Not found");
      })
      .catch(next);
    return;
  }
  res.json(result.rows[0]);
});

router.post("/", async function (req, res, next) {
  const id = await userId(req);

  if (!id) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }

  const { title, description, bounty, deadline } = req.body;
  if (!title || !description) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid data");
      })
      .catch(next);
    return;
  }
  const conn = await getConnection();
  const result = await conn.query(
    "INSERT INTO ideas (user_id, title, description, bounty, deadline, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
    [id, title, description, bounty, deadline]
  );
  res.json(result.rows[0]);
});

router.put("/:id", async function (req, res, next) {
  const usersId = await userId(req);
  if (!usersId) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid id");
      })
      .catch(next);
    return;
  }
  const { title, description, bounty, deadline } = req.body;
  const conn = await getConnection();
  let result = await conn.query("SELECT * FROM ideas WHERE id = $1 AND user_id = $2", [id, usersId]);
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  const old = result.rows[0];
  result = await conn.query(
    "UPDATE ideas SET title = $1, description = $2, bounty = $3, deadline = $4, updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING *",
    [title || old.title, description || old.description, bounty || old.bounty, deadline || old.deadline, id, usersId]
  );
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  res.json(result.rows[0]);
});

router.delete("/:id", async function (req, res, next) {
  const usersId = await userId(req);
  if (!usersId) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid id");
      })
      .catch(next);
    return;
  }
  const conn = await getConnection();
  const result = await conn.query("DELETE FROM ideas WHERE id = $1 AND user_id = $2 RETURNING *", [id, usersId]);
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  res.json(result.rows[0]);
});

router.get("/:id/proposals", async function (req, res, next) {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid id");
      })
      .catch(next);
    return;
  }
  const conn = await getConnection();
  const result = await conn.query("SELECT * FROM proposals WHERE idea_id = $1", [id]);
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Not found");
      })
      .catch(next);
    return;
  }
  res.json(result.rows);
});

router.post("/:id/proposals", async function (req, res, next) {
  const usersId = await userId(req);
  if (!usersId) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid id");
      })
      .catch(next);
    return;
  }
  const { description } = req.body;
  if (!description) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid data");
      })
      .catch(next);
    return;
  }
  const conn = await getConnection();
  const result = await conn.query(
    "INSERT INTO proposals (user_id, idea_id, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *",
    [usersId, id, description]
  );
  res.json(result.rows[0]);
});

router.put("/:id/proposals/:proposalId", async function (req, res, next) {
  const usersId = await userId(req);
  if (!usersId) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid id");
      })
      .catch(next);
    return;
  }
  const proposalId = parseInt(req.params.proposalId)
  if (isNaN(proposalId)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid proposal id");
      })
      .catch(next);
    return;
  }
  const { description } = req.body;
  const conn = await getConnection();
  let result = await conn.query("SELECT * FROM proposals WHERE id = $1 AND user_id = $2", [proposalId, usersId]);
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  const old = result.rows[0];
  result = await conn.query(
    "UPDATE proposals SET description = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *",
    [description || old.description, proposalId, usersId]
  );
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  res.json(result.rows[0]);
});

router.delete("/:id/proposals/:proposalId", async function (req, res, next) {
  const usersId = await userId(req);
  if (!usersId) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid id");
      })
      .catch(next);
    return;
  }
  const proposalId = parseInt(req.params.proposalId)
  if (isNaN(proposalId)) {
    Promise.resolve()
      .then(() => {
        throw new Error("Invalid proposal id");
      })
      .catch(next);
    return;
  }
  const conn = await getConnection();
  const result = await conn.query("DELETE FROM proposals WHERE id = $1 AND user_id = $2 RETURNING *", [proposalId, usersId]);
  if (result.rows.length === 0) {
    Promise.resolve()
      .then(() => {
        throw new Error("Unauthorized");
      })
      .catch(next);
    return;
  }
  res.json(result.rows[0]);
});

module.exports = router;
