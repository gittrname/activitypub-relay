var createError = require('http-errors');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var url = require('url');

var config = require('./config/settings');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json({
  type: 'application/activity+json',
  verify: function (req, res, buf, encoding) {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Httpヘッダー「Host」を強制的に自ドメインにする。
app.use(function(req, res, next) {

  var relayUrl = url.parse(config.relay.url);

  req.headers['host'] = relayUrl.host;
  next();
});


//
app.use('/', require('./routes/web_service'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err.message);

  res.status(err.status || 500);
  res.send(err.message);
});

module.exports = app;
