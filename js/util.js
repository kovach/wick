var _ = require('underscore');

var handle = function(handlers, msg) {
  _.find(handlers, function(val, key) {
    if (msg.tag === key) {
      val(msg.data, msg);
      return true;
    }
  });
}

var doWhile = _.find;
var done = true;

module.exports = {
  handle: handle,
  doWhile: doWhile,
  done: done,
}
