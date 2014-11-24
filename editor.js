var d = require('diff');
var _ = require('underscore');
var doWhile = _.find;
var done = true;
var curs = require('./diff');

// Global state
var old_content;
var ws;

var tabKeyBinding = function(cm) {
  var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
  cm.replaceSelection(spaces);
}
var diffKeyBinding = function(cm) {
  var new_content = cm.getValue();
  //var diffs = d.diffLines(old_content, new_content);
  var patch = d.createPatch("F", old_content, new_content);
  old_content = new_content;
  return patch;
}
var rollbackKeyBinding = function(cm) {
  var str = cm.getValue();
  var changes = d.diffLines(str, old_content);
  var new_pos = curs.locateCursor(cm, changes);
  var patch = d.createPatch("F", str, old_content);
  var new_content = d.applyPatch(str, patch);
  cm.setValue(new_content);
  cm.setCursor(new_pos);
}
var sendKeyBinding = function(cm) {
  if (ws) {
    var data = diffKeyBinding(cm);
    var msg = {
      tag: 'diff',
      data: data
    };
    ws.send(JSON.stringify(msg));
  } else {
    console.log('no websocket?');
  }
}

var changeType = function(change) {
  if (change.added)
    return 'added';
  else if (change.removed)
    return 'removed';
  else
    return 'same';
}
var extraKeys = {
  Tab: tabKeyBinding,
  'Ctrl-Enter': sendKeyBinding,
  'Ctrl-Backspace': rollbackKeyBinding,
}

var makeMirror = function(id, socket) {
  ws = socket;
  var editor =
    CodeMirror.fromTextArea(
      document.getElementById(id),
      { value: "function myScript(){return 100;}\n",
        mode:  "javascript",
        matchBrackets: true,
        //keyMap: "vim",
        keyMap: "default",
        showCursorWhenSelecting: true
      });
  console.log(editor);
  old_content = editor.getValue();
  editor.setOption("extraKeys", extraKeys);

  return editor;
}

module.exports = {
  makeMirror: makeMirror,
}
