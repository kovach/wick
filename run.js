/* @flow */
// TODO copy input version to dir
// TODO report space usage (and estimated space usage for output?)
// TODO diff support
var fs = require('fs');
var _ = require('underscore');
var repl = require('repl');

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var doWhile = _.find;
var done = true;

var evalFile = function(filepath) {
  fs.readFile(filepath, {encoding: 'utf8'}, function(err, data) {
    if (err) throw err;
    var lines = data.split('\n');
    doWhile(lines, function(line) {
      if (line.length == 0) {
        return done;
      }
      console.log(line);
      // TODO use spawn
      exec(line);
    });
  });
}

var main = function() {
  // First two args are 'node' and the program name
  if (process.argv.length === 3) {
    evalFile(process.argv[2]);
  } else {
    console.log('error: requires exactly one file argument.');
  }
}

main();

//repl.start({
//    prompt: "→ ",
//    input: process.stdin,
//    output: process.stdout
//});
