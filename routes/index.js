var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(_, res, _) {
  res.send("Hello World!")
});

module.exports = router;
