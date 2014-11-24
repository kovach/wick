var editor = require('./editor');
var client = require('./client');
_ = require('underscore');

ws = client.init();
ed = editor.makeMirror("ta", ws);
client.setHandler(editor.handler);
