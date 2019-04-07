#!/usr/bin/env node

var fs = require('fs');
var generateRSAKeypair = require('generate-rsa-keypair')


console.log('Generate Keypair.');

/*
 * 署名用キーペア作成
 */
var keyPair = generateRSAKeypair();
fs.writeFileSync('config/relay_keypair.json', JSON.stringify(keyPair));

