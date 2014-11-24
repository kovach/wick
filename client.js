var WS = require('ws');
var _ = require('underscore');

// Global state
var ws;

var parseURL = function() {
  var m = location.pathname.match(/^\/page\/(\w*)$/);
  if (m) {
    var page = m[1];
    console.log(page);
    var msg = {
      tag: 'read',
      data: page
    }
    ws.send(JSON.stringify(msg));
  }
}
var init = function() {
  ws = new WS('ws://'+document.domain+':4444/');
  ws.onopen = function() {
    console.log('ws open');
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
