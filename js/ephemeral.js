// Same interface as tracker.js, but using a simple index of files
// Only works for current directory
// TODO support nested directories

var _ = require('underscore');
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
  return new tracker(root);
}
var tracker = function(root) {
  var that = this;
  that.root = root + '/';
  that.files = {};
  var file_names = fs.readdirSync(root);
  _.each(file_names, function(file_name) {
    that.files[file_name] = that.current(file_name);
  });
}
tracker.prototype.fileCheck = function(name) {
  return fs.existsSync(fileDir(this.root) + name);
}
tracker.prototype.initFile = function(name) {
  fs.writeFile(fileDir(this.root) + name, '');
}
tracker.prototype.current = function(name) {
  var str = fs.readFileSync(fileDir(this.root) + name, opt);
  return sha256(str);
}
var opt = {encoding: 'utf8'};
tracker.prototype.readHead = function(name) {
  return fs.readFileSync(fileDir(this.root) + name, opt);
}
// TODO handle subdirectories
tracker.prototype.commitFile = function(name, str) {
  fs.writeFileSync(fileDir(this.root) + name, str);
}
// TODO commitFiles (see tracker.js)

module.exports = {
  initIndex: initIndex,
  tracker: tracker,
  mkTracker: mkTracker,
}
