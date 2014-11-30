// TODO reimplement using git?
//
// A simple content-addressed diff-based file index

// directory layout:
// root/
//   .wick/
//     files/
//       'name': [contents = head ref]]
//     diffs/
//       'ref': [contents = prev ref/unified diff]

var fs = require('fs');
var _ = require('underscore');
var d = require('diff');
var sha256_ = require('crypto-js/sha256');
var digest = require('./digest');

var sha256 = digest.sha256;
var emptyHash = digest.emptyHash;

// TODO make members
var wickDir = function(root) {
  return root + '/.wick/';
}
var fileDir = function(root) {
  return root + '/.wick/files/';
}
var diffDir = function(root) {
  return root + '/.wick/diffs/';
}

var initIndex = function(root) {
  fs.mkdirSync(wickDir(root));
  fs.mkdirSync(fileDir(root));
  fs.mkdirSync(diffDir(root));
  fs.writeFile(diffDir(root) + emptyHash, '');
}

var opt = {encoding: 'utf8'};
var mkTracker = function(root) {
  var files_prefix = fileDir(root);
  var file_names = fs.readdirSync(files_prefix);
  var files = {};
  _.each(file_names, function(file_name) {
    var diff_ref = fs.readFileSync(files_prefix + file_name, opt);
    if (diff_ref[diff_ref.length-1] == '\n') {
      diff_ref = diff_ref.slice(0,-1);
    }
    files[file_name] = diff_ref;
  });
  var diffs_prefix = diffDir(root);
  var diff_refs = fs.readdirSync(diffs_prefix);
  var diffs = {};
  _.each(diff_refs, function(diff_ref) {
    var diff_str = fs.readFileSync(diffs_prefix + diff_ref, opt);
    var lines = diff_ref.split('\n');
    var prev; var patch;
    if (lines.length > 1) {
      prev = lines.shift(); patch = lines.join('\n');
    } else {
      prev = undefined;
      patch = "";
    }
    diffs[diff_ref] = {prev: prev, patch: patch};
  });
  this.root = root;
  this.files = files;
  this.diffs = diffs;
}

mkTracker.prototype.fileCheck = function(name) {
  var index = this;
  if (index.files[name]) {
    return true;
  }
  return false;
}

mkTracker.prototype.initFile = function(name) {
  var index = this;
  var ref = emptyHash;
  fs.writeFile(fileDir(index.root)+name, ref);
  index.files[name] = ref;
}
mkTracker.prototype.current = function(name) {
  return this.files[name];
}

// Follow diff chain
mkTracker.prototype.readHead = function(name) {
  var index = this;
  if (!index.fileCheck(name)) {
    console.log("tracker.js:readHead. name doesn't exist: ", name);
    return;
  }

  var head = index.current(name);
  var patches = [];
  var ref = head;
  while (index.diffs[ref].prev !== undefined) {
    patches.push(index.diffs[ref].patch);
    ref = index.diffs[ref].prev;
  }
  patches.reverse();

  var str = "";
  _.each(patches, function(patch) {
    str = d.applyPatch(str, patch);
  });

  return str;
}

// TODO
var makeDiff = function(prev, patch) {
}
var parseDiff = function(diff) {
  // return prev, patch
}

// Calculate diff, commit
mkTracker.prototype.commitFile = function(name, str) {
  var index = this;
  var prev_str = index.readHead(name);
  var prev_hash = index.files[name];
  if (str === prev_str) {
    console.log('no change from index: ', name);
    return;
  }
  var patch = d.createPatch(name, prev_str, str);
  var diff = prev_hash + '\n' + patch;
  var new_hash = sha256(str);
  // New diff object
  fs.writeFileSync(diffDir(index.root) + new_hash, diff);
  // Update pointer
  fs.writeFileSync(fileDir(index.root) + name, new_hash);

  // Update index
  index.files[name] = new_hash;
  index.diffs[new_hash] = {prev: prev_hash, patch: patch};
}

// TODO
// needed for regenerating wick graph?
// diff between indices, batch commit
//  - intersect file lists, check digests, map commitFile
//  - return changes
// e.g. diff an ephemeral against its tracker to commit updates
// commitFiles = function(other-index) {
// }

module.exports = {
  initIndex: initIndex,
  mkTracker: mkTracker,
}
