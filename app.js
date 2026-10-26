var createError = require('http-errors');
var express = require('express');
var session = require('express-session');
var { RedisStore } = require('connect-redis');
var { createClient } = require('redis');
var path = require('path');
var bodyParser = require('body-parser');
var logger = require('morgan');
var passport = require('passport');
var formAuth = require('./authentication/form_authentication');

var config = require('./settings');

var app = express();

// viewエンジン
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
// ログレベル
app.use(logger('dev'));
// パーサー
app.use(bodyParser.json({
  type: [
    'application/json',
    'application/activity+json'
  ],
  verify: function (req, res, buf, encoding) {
    // rawデータ取得
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));
// セッション
var redisClient = null;
if (process.env.NODE_ENV !== 'test') {
  redisClient = createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port
    },
    password: config.redis.password || undefined
  });
  redisClient.on('error', function(err) {
    console.error('Redis error: ' + err);
  });

  if (typeof redisClient.connect === 'function') {
    redisClient.connect().catch(function(err) {
      console.error('Redis connection failed: ' + err.message);
      process.exit(1);
    });
  }
}

app.use(session({
  secret: 'relay',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 10 * 60 * 1000
  },
  store: process.env.NODE_ENV === 'test' ? undefined : new RedisStore({ client: redisClient })
}));
// 認証機能
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
})
passport.use(formAuth);
app.use(passport.initialize());
app.use(passport.session());
// 静的ファイル
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
// Httpヘッダー「Host」を強制的に自ドメインにする。
// (ローカル環境だとIPアドレスとなるため（暫定対応）)
app.use(function(req, res, next) {

  var relayUrl = new URL(config.relay.url);
  req.headers['host'] = relayUrl.host;

  next();
});

console.log("・relay")
console.log("　host: "+config.relay.url);
console.log("　privatekey: "+config.relay.privateKey);
console.log("　publickey: "+config.relay.publicKey);

console.log("・redis")
console.log("　host: "+config.redis.host);
console.log("　port: "+config.redis.port);

console.log("・database")
console.log("　host: "+config.database.connection.host);
console.log("　port: "+config.database.connection.port);
console.log("　name: "+config.database.connection.database);

console.log("・influx")
console.log("　host: "+config.influx.host);
console.log("　port: "+config.influx.port);
console.log("　database: "+config.influx.database);


// web_service
app.use('/', require('./routes/web_service'));
// ui
app.use('/ui', require('./routes/ui'));
// admin
if (process.env.NODE_ENV !== 'test') {
  app.use('/admin', require('./routes/admin'));
}

// api
app.use('/api', require('./routes/api'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  console.log(err.message+". path:"+req.path);

  res.status(err.status || 500);
  res.send(err.message);
});

module.exports = app;
