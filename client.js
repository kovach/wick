var WS = require('ws');
var _ = require('underscore');

var handler = function(message) {
  var msg = JSON.parse(message.data);
  console.log('message: ', msg);
}
var init = function() {
  var ws = new WS('ws://'+document.domain+':4444/');
  ws.onmessage = handler;
  ws.onopen = function() {
    console.log('ws open');
  }
  return ws;
}
module.exports = {
  init: init,
}
