#!/usr/bin/env node

var fs = require('fs');
var generateRSAKeypair = require('generate-rsa-keypair')


console.log('Generate Keypair.');

/*
 * 署名用キーペア作成
 */
var keyPair = generateRSAKeypair();
console.log("private key: "+keyPair.private);
console.log("public key: "+keyPaire.public);
