var d = require('../js/digest');
var p = require('./then');

var hashObject = function(file) {
  return p.exec('sha256sum' + ' ' + file);
}
var getObject = function(file) {
  return p.file(file);
}
// Generally 
var runCommand = function(str) {
  return p.exec(str);
}

module.exports = {
  hashObject: hashObject,
  getObject: getObject,
  runCommand: runCommand,
}
