/**
 * 接続不能ドメインの購読を解除する
 */
var path = require('path');
var program = require('commander');
var packageJson = require('../package.json');

require('dotenv').config({ 
    path: path.resolve(__dirname, '../.env.development') 
});
var connect = require('./lib/connect');
var database = require('../database');
const { exit } = require('process');

// プログラム初期化
program
  .version(packageJson.version)
  .parse(process.argv);
console.log('check relay domains.');

// 配送確認処理
return main();

async function main() {
    var domains = await database('relays')
        .where('relays.status', 1);
    
    for(idx in domains) {
        const row = domains[idx]
        const domain = 'https://' + row['domain'];
        console.log(domain);
        // 接続チェック
        try {
            await connect(domain);
            console.log('  connect success.');
        } catch (err) {
            console.log(err);
            console.log('  connect fail.');
            // 配送停止
            await database('relays')
                .where('id', row['id'])
                .update({'status': 0})
                .catch(function(err) {
                    console.log(err.message);
                });
        }
    }
    console.log('domain connect check end.');
    exit();
}