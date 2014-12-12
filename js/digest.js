var fs = require('fs');
var exec = require('child_process').exec;

var sha256_ = require('crypto-js/sha256');

var sha256 = function(str) {
  return sha256_(str).toString();
}

var emptyHash = sha256('');

var execSha = function(file, callback) {
  exec('sha256sum ' + file, callback);
}

module.exports = {
  sha256: sha256,
  emptyHash: emptyHash,
  execSha: execSha,
}
