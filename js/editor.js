// TODO diff commute, rewrite locateCursor

var _ = require('underscore');
var d = require('diff');

var curs = require('./diff');
var util = require('./util');
var digest = require('./digest');
var sha256 = digest.sha256;

// Global state
var editor;
var old_content;
var prev_diff;
var ws;
var current_page;
var current_workspace;

var updateWithFile = function(data) {
  editor.setValue(data.body);
  old_content = data.body;
  prev_diff = sha256(data.body);
  current_page = data.page;
  current_workspace = data.workspace;
}

var updateWithDiff = function(data) {
  console.log('GOT DIFF:', data);
  console.log(prev_diff);
  console.log(data.diff.prev);
  if (data.diff.prev === prev_diff) {
    console.log('diff: ', data);
    var new_content = d.applyPatch(old_content, data.diff.patch);
    var changes = d.diffChars(old_content, new_content);
    old_content = new_content;
    prev_diff = sha256(new_content);
    editor.setValue(new_content);
    var new_pos = curs.locateCursor(editor, changes);
    editor.setCursor(new_pos);
  } else {
    console.log('INVALID DIFF');
    // TODO request current file value
    // TODO distinguish between different file/wrong file value:
    //       (see server.js id2 line)
  }
}

var tabKeyBinding = function(cm) {
  var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
  cm.replaceSelection(spaces);
}
var makeDiff = function(new_content) {
  if (old_content === new_content) {
    return;
  }
  var patch = d.createPatch("", old_content, new_content);
  old_content = new_content;
  return patch;
}
var sendDiff = function(cm) {
  if (ws) {
    var content = cm.getValue();
    var patch = makeDiff(content);
    if (!current_workspace) {
      console.log('you are editing an invalid file or workspace!');
      return;
    }
    if (patch) {
      var msg = {
        tag: 'diff',
        data: {
          workspace: current_workspace,
          name: current_page,
          diff: {patch: patch, prev: prev_diff}},
      };
      prev_diff = sha256(content);
      console.log('new ref:', prev_diff);
      ws.send(JSON.stringify(msg));
    } else {
      // no change to report
    }
  } else {
    console.log('no websocket?');
  }
}

var makeMirror = function(id, socket) {
  ws = socket;

  var extraKeys = {
    Tab: tabKeyBinding,
  }

  editor =
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

  // TODO is this the right set of events?
  // Needed for backspace
  editor.on('keyHandled', function(cm) {
    sendDiff(cm);
  });
  // Needed for edit events
  editor.on('inputRead', function(cm) {
    sendDiff(cm);
  });

  return editor;
}

var client_handlers = {
  'diff': updateWithDiff,
  'read': updateWithFile,
}

var msgHandler = function(message) {
  var msg = JSON.parse(message.data);
  util.handle(client_handlers, msg);
}

module.exports = {
  makeMirror: makeMirror,
  msgHandler: msgHandler,
}
