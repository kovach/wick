var fs = require('fs');
var exec = require('child_process').exec;

var id = function(x) {
  return x;
}

var mk = function(fn) {
  var p = {};
  p.val = fn;
  p.ps = [];
  p.run = function(input) {
    // Evaluate this promise's transformation
    var val = p.val(input);
    // Pass the result to each promise that depends on it
    _.each(p.ps, function(fn) {
      fn(val);
    });
  }
  // Add a new successor function-promise
  p.then = function(fn) {
    var newp = mk(fn);
    p.ps.push(newp.run);
    return newp;
  }
  // Add a list of successor promises
  p.par = function() {
    _.each(arguments, function(arg) {
      p.then(arg);
    });
  }
  // Add a successor promise
  // Wraps it in a promise (wrapper) that can be bound to immediately with
  // then, but isn't bound until the current promise finishes, at which point
  // the successor promise is generated and binds wrapper.
  p.seq = function(fn) {
    var wrapper = mk(id);
    p.ps.push(function(val) {
      var other_p = fn(val);
      other_p.ps.push(wrapper.run);
    });
    return wrapper;
  }
  return p;
}

var pure = function(val) {
  var p = mk(id);
  setImmediate(function() {
    p.run(val);
  });
  return p;
}

// Join a collection of promises together.
//
// Joint promise returns the results as an object
// with same keys as the 'promises' argument.
var join = function(promises) {
  var count = 0;
  var joint = mk(id);
  var result = {};
  // Number of key/value pairs
  var size = _.size(promises);

  _.each(promises, function(promise, name) {
    promise.then(function(val) {
      result[name] = val;
      count++;
      if (count >= size) {
        joint.run(result);
      }
    });
  });

  return joint;
}

// Promise primitives
var filePromise = function(file) {
  var p = mk(id);
  fs.readFile(file, {encoding: 'utf8'}, function(err, data) {
    var result = {};
    if (err) {
      result.failure = true;
    } else {
      result.body = data;
    }
    p.run(result);
  });
  return p;
}

var execPromise = function(command) {
  var p = mk(id);
  console.log('RUNNING: ', command);
  exec(command, function(err, stdout, stderr) {
    var result = {};
    if (err) {
      result.failure = true;
    }
    result.out = stdout;
    result.err = stderr;
    p.run(result);
  });
  return p;
}

module.exports = {
  // TODO don't export this?
  mk: mk,

  join: join,
  id: id,
  file: filePromise,
  exec: execPromise,
  pure: pure,
}
