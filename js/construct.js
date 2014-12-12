// Terminology
// construct: text file specification of inputs, outputs, command, and
//   reference to current construction or null if construct is 'fresh'
// construction: the 'commit' referring to a particular execution of a
//   construct. Contains hashes of inputs, outputs, previous construction,
//   and the construct file used
// fresh: describes construct that hasn't yet generated a construction
//
// index: js object describing a construct
// construction: js object describing a construction

var fs = require('fs');
var exec = require('child_process').exec;
var opt = {encoding: 'utf8'};
var _ = require('underscore');
var path = require('path');

var sha256 = require('./digest').sha256;
var u = require('./util');
var parse = require('./parse');
var w = require('../interfaces/file');
var p = require('../interfaces/then');

var t = function() {
  var index = readIndex('0');
  return index;
}
var readByName = function(local) {
  var fn = path.join('.wick/constructs/core', local);
  var str = fs.readFileSync(fn, opt);
  return str;
}

var readIndex = function(id) {
  var str = readByName(id);
  return parseIndex(str);
}

var parseIndex = function(str) {
  var fileHash = sha256(str);
  var lines = str.split('\n');
  var index = {};
  index.inputs = [];
  index.outputs = [];
  index.commands = [];
  var state = parse.mkParser(lines);
  // If first line is empty (construct is fresh), current will be undefined
  parse.takeLine(state, function(line) {
    // Construct hasn't been run yet
    index.current = line;
  });
  parse.takeLines(state, function(line) {
    index.inputs.push(line);
  });
  parse.takeLines(state, function(line) {
    index.outputs.push(line);
  });
  parse.takeLines(state, function(line) {
    index.commands.push(line);
  });
  var rest = parse.lines(state);
  if (rest.length !== 0) {
    console.log('parseIndex. error, unparsed lines: ', rest);
  }
  index.hash = fileHash;
  return index;
}

var parseConstruction = function(str) {
}

var hashFiles = function(files) {
  var hashP = {};
  _.each(files, function(file) {
    hashP[file] = w.hashObject(file);
  });
  // Replace promise object with values
  return p.join(hashP).then(
      function(vals) {
        var commit = {};
        var hashes = [];

        _.each(vals, function(hash, file) {
          if (hash.failure) {
            commit.failure = true;
          }
          hashes.push(hash.out);
        });

        commit.body = hashes.join('\n');
        commit.hash = sha256(commit.body);

        return commit;
      });
}

// Computes hash of input tree
var hashInputs = function(index) {
  return hashFiles(index.inputs);
}

// Computes hash of input tree
var hashOutputs = function(index) {
  return hashFiles(index.outputs);
}

// Returns true if inputs have changed or construct is fresh
var canUpdate = function(index) {
}

// Runs commands, hashes inputs and outputs, creates construction object
var runIndex = function(index) {
  return hashInputs(index).seq(function(inputHash) {
    console.log('INPUTS');
    if (inputHash.failure) {
      // Some input is missing
      return p.pure({failure: true, body: 'missing-input'});
    }

    return p.join(_.map(index.commands, p.exec)).seq(function(command_outputs) {
      console.log('COMMANDS');
      var failed = _.find(command_outputs, function(output) {
        return output.failure;
      });
      if (failed) {
        return p.pure({failure: true, body: failed});
      }

      return hashOutputs(index).then(function(outputHash) {
        console.log('OUTPUTS');
        if(outputHash.failure) {
          return ({failure: true, body: 'missing-output'});
        }

        // Everything was successful
        var body = [inputHash.body, outputHash.body, index.hash+'\n'].join('\n');
        return ({input: inputHash, output: outputHash,
          hash: sha256(body), body: body});
      });
    });
  });
}

// store has the type of interfaces/file
var updateIndex = function(store, index) {
}

// Returns string
var writeCommit = function(file, commit) {
  fs.writeFileSync(file, commit.body);
}

module.exports = {
  readIndex: readIndex,
  parseIndex: parseIndex,
  hashInputs: hashInputs,
  hashOutputs: hashOutputs,
  runIndex: runIndex,
  writeCommit: writeCommit,
  t: t
}

