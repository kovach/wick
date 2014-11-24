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
    console.log(delta + " : " + type + " : " + JSON.stringify(change.value));
    switch (type) {
      case 'added':
        final_pos.line += delta;
        break;
      case 'removed':
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
module.exports = {
  locateCursor: locateCursor,
}
