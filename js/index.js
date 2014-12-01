var _ = require('underscore');

var getFiles = function(index) {
  return index.files;
}
var getNames = function(index) {
  return _.keys(index.files);
}

var diffIndex = function(index1, index2) {
  var shared = _.intersection(getNames(index1), getNames(index2));
  var delta = [];
  _.each(shared, function(name) {
    if (index1.current(name) !== index2.current(name)) {
      delta.push(name);
    }
  });
  return delta;
}

var copyFile = function(from, to, name) {
  if (from.fileCheck(name)) {
    to.commitFile(from.readHead(name));
    return true;
  } else {
    console.log('cannot copy!!');
  }
  return false;
}

var commitDiff = function(base, working) {
  var diffs = diffIndex(base, working);
  _.each(diffs, function(name) {
    console.log('different: ', name);
    copyFile(working, base, name);
  });
}

module.exports = {
  getNames: getNames,
  commitDiff: commitDiff,
  diffIndex: diffIndex,
}
