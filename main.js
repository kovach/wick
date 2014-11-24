var editor = require('./editor');
var client = require('./client');

var ws = client.init();
ed = editor.makeMirror("ta", ws);
