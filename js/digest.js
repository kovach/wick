var sha256_ = require('crypto-js/sha256');

var sha256 = function(str) {
  return sha256_(str).toString();
}

var emptyHash = sha256('');

module.exports = {
  sha256: sha256,
  emptyHash: emptyHash,
}
