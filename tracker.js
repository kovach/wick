var fs = require('fs');
var _ = require('underscore');
var d = require('diff');
var sha256_ = require('crypto-js/sha256');

var sha256 = function(str) {
  return sha256_(str).toString();
}

var emptyHash = sha256('');

// Directory layout
// root
//   {names}
//   .wick
//     files/
//       'name': [contents = head ref]]
//     diffs/
//       'ref': [contents = prev ref/unified diff]

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

var initFile = function(index, name) {
  var ref = emptyHash;
  fs.writeFile(fileDir(index.root)+name, ref);
  index.files[name] = ref;
}

var opt = {encoding: 'utf8'};
var buildIndex = function(root) {
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
  return {root: root, files: files, diffs: diffs};
}

var assert = function(bool, str) {
  if (!bool) {
    throw ('error: ', str);
  }
}

// Follow diff chain
var readHead = function(index, name) {
  var head = index.files[name];
  if (head === undefined) {
    console.log("name doesn't exist: ", name);
    return;
  }
  var patches = [];
  var ref = head;
  while (index.diffs[ref].prev !== undefined) {
    patches.push(index.diffs[ref].patch);
    ref = index.diffs[ref].prev;
  }
  patches.reverse();

  console.log(patches);
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
var commitFile = function(index, name, str) {
  var prev_str = readHead(index, name);
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

module.exports = {
  initIndex: initIndex,
  buildIndex: buildIndex,

  initFile: initFile,
  readHead: readHead,
  commitFile: commitFile,
}
