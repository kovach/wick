// Same interface as tracker.js, but using a simple index of files

var fs = require('fs');
var digest = require('./digest');
var sha256 = digest.sha256;
var emptyHash = digest.emptyHash;

// TODO make members
var wickDir = function(root) {
  return root;
}
var fileDir = function(root) {
  return root;
}
var diffDir = function(root) {
  return root;
}

var initIndex = function(root) {
}
// TODO rename to mkIndex
var mkTracker = function(root) {
  this.root = root + '/';
}
mkTracker.prototype.fileCheck = function(name) {
  return fs.existsSync(fileDir(this.root) + name);
}
mkTracker.prototype.initFile = function(name) {
  fs.writeFile(fileDir(this.root) + name, '');
}
mkTracker.prototype.current = function(name) {
  var str = fs.readFileSync(fileDir(this.root) + name, opt);
  return sha256(str);
}
var opt = {encoding: 'utf8'};
mkTracker.prototype.readHead = function(name) {
  return fs.readFileSync(fileDir(this.root) + name, opt);
}
mkTracker.prototype.commitFile = function(name, str) {
  fs.writeFileSync(fileDir(this.root) + name, str);
}
// TODO commitFiles (see tracker.js)

module.exports = {
  initIndex: initIndex,
  mkTracker: mkTracker,
}
