var express = require("express");
var router = express.Router();
const { limitOffset } = require("../utils");

/* GET home page. */
router.get("/", function (req, res) {
  let [limit, offset] = limitOffset(req);
  res.json({ msg: "Hello World!", limit, offset });
});

module.exports = router;
