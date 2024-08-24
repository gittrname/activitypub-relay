var program = require('commander');

var connect = require('./lib/connect');

var packageJson = require('../package.json');

// プログラム初期化
program
  .version(packageJson.version)
  .parse(process.argv);
console.log('check host: %s', program.args[0]);

// 接続チェック
main(program.args[0]);

async function main() {
  try {
    await connect(program.args[0])
    console.log('connect success.');
  } catch (err) {
    console.log(err);
    console.log('connect fail.');
  }
}
/**
 * ・getaddrinfo ENOTFOUND
 * 　node cli/check_host.js https://m.puni.moe
 * ・Error [ERR_TLS_CERT_ALTNAME_INVALID]
 * 　node cli/check_host.js https://misskey.fish-blog.f5.si
 * ・410 Gone
 * 　node cli/check_host.js https://crpk.sonyakun.com
 * ・522
 * 　node cli/check_host.js 
 * ・530
 * 　node cli/check_host.js https://m.ne53.net
 */