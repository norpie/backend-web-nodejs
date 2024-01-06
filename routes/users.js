var express = require("express");
var router = express.Router();
const { limitOffset } = require("../utils");

/* GET users/ */
router.get("/", function (req, res) {
  let [limit, offset] = limitOffset(req);
  return res.json({ limit, offset });
});

/* POST users/ */
router.post("/", function (req, res) {
  return res.json(req.body);
});

/* GET users/:id */
router.get("/:id", function (req, res) {
  const { id } = req.params;
  return res.json({ id });
});

/* PUT users/:id */
router.put("/:id", function (req, res) {
  const { id } = req.params;
  return res.json({ id });
});

/* DELETE users/:id */
router.delete("/:id", function (req, res) {
  const { id } = req.params;
  return res.json({ id });
});

module.exports = router;
