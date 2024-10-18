var express = require('express');
var database = require('../database');
var router = express.Router();

//
// Topページ
router.get('/', function (req, res, next) {

  database('relays')
    .then(function(instances) {
      res.render("top", {'instances': instances});
    })
});

//
// Servicerページ
router.get('/servicer', function (req, res, next) {
  res.render("servicer");
});


module.exports = router;