var express = require('express');
var router = express.Router();

//
// Topページ
router.get('/', function (req, res, next) {
  res.render("top");
});

//
// Servicerページ
router.get('/servicer', function (req, res, next) {
  res.render("servicer");
});

//
// Userページ
router.get('/user', function (req, res, next) {
  res.render("user");
});


module.exports = router;