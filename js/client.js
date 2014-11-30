var WS = require('ws');
var _ = require('underscore');

// Global state
var ws;

var parseURL = function() {
  var workspace_regex = /^\/(\w*)\/(\w*)$/;
  var m = location.pathname.match(workspace_regex);
  if (m) {
    var workspace = m[1];
    var name = m[2];
    var msg = {
      tag: 'workspace',
      data: {
        workspace: workspace,
        name: name,
      },
    };
    ws.send(JSON.stringify(msg));
  } else {
    console.log('invalid url: ', location.pathname);
  }
}

var init = function() {
  ws = new WS('ws://'+document.domain+':4444/');
  ws.onopen = function() {
    parseURL();
  }
  return ws;
}

var setHandler = function(handler) {
  ws.onmessage = handler;
}
module.exports = {
  init: init,
  setHandler: setHandler,
}
