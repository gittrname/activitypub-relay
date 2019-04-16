#!/usr/bin/env node

var fs = require('fs');
var generateRSAKeypair = require('generate-rsa-keypair')


console.log('Generate Keypair.');

/*
 * 署名用キーペア作成
 */
try {
  console.log('keypair is already created.');
} catch (err) {
  var keyPair = generateRSAKeypair();
  fs.writeFileSync('config/relay_keypair.json', JSON.stringify(keyPair));
}
