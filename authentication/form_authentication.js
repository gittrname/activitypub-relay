var LocalStrategy = require('passport-local').Strategy;

// 設定をロード
var config = require('../settings');

// フォーム認証処理
module.exports = new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  failureFlash: 'IDまたはパスワードが正しくありません。',
  passReqToCallback: true,
  session: true,
}, function(req, username, password, done) {
  console.log("username:"+username+", password:"+password);
  if (username === config.admin.username
    && password === config.admin.password) {
    console.log("login success.");
    return done(null, username);
  } else {
    console.log("login fail.");
    return done(null, false);
  }
});