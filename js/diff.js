var _ = require('underscore');
var d = require('diff');

var doWhile = _.find;
var done = true;

var changeType = function(change) {
  if (change.added)
    return 'added';
  else if (change.removed)
    return 'removed';
  else
    return 'same';
}

// Positions the cursor after a diff is applied
var locateCursor = function(cm, changes) {
  var current_pos = cm.getCursor();
  var cursor_line = current_pos.line;
  var cursor_ch = current_pos.ch;
  var final_pos = {line: cursor_line, ch: cursor_ch};
  console.log('pos: ' + cursor_line);

  var level = 0;
  doWhile(changes, function(change) {
    var lines = change.value.split('\n');
    var delta = lines.length - 1;
    var type = changeType(change);
    switch (type) {
      case 'added':
        final_pos.line += delta;
        break;
      case 'removed':
        // TODO fix this end condition
        if (level + delta > cursor_line) {
          final_pos.ch = 0;
          final_pos.line -= (cursor_line - level);
          return done;
        }
        level += delta;
        final_pos.line -= delta;
        break;
      case 'same':
        if (level + delta > cursor_line) {
          return done;
        }
        level += delta;
        break;
    }
  });
  return final_pos;
}

var diffMods = function(f, t) {
  var changes = d.diffChars(f, t);
  var mods = getMods(changes);
  return mods;
}

var getMods = function(changes) {
  return _.filter(changes, function(change) {
    switch (changeType(change)) {
      case 'added':
      case 'removed':
        return true;
      default:
        return false;
    }
  });
}

module.exports = {
  locateCursor: locateCursor,
  getMods: getMods,
  diffMods: diffMods,
}
