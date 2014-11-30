// TODO make stuff async
// share other users' cursors

// What this does:
//  - run a wick instance
//  - create working directory at user's request
//  - distribute updates over websocket between users connected to a workspace
//  - (soon)updates wick graph for working dir, distributes changes

var _ = require('underscore');
var d = require('diff');
var WSS = require('ws').Server;
var fs = require('fs');
var express = require('express');
var http = require('http');
var util = require('./js/util');
var t = require('./js/tracker');
var eph = require('./js/ephemeral');

// Global state
var global_root_dir = __dirname + '/pages/';
var clients = {};
// _.uniqueId
var global_index;
var workspaces = {};

// Initialize repository
console.log(global_root_dir);

t.initIndex(global_root_dir);
var global_index = new t.mkTracker(global_root_dir);
global_index.initFile('a');
global_index.commitFile('a', 'a');
global_index.initFile('b');
global_index.commitFile('b', 'b');

// result:
console.log(global_index);
console.log(global_index.readHead('a'));
console.log(global_index.readHead('b'));

// End repo init
// TODO move this? ^

//var readPage = function(page, callback) {
//  var page_dir  =  __dirname + '/pages/';
//  var file_path = page_dir + page;
//  var dir_path  = page_dir + '.' + page;
//
//  // ????
//    var data = {};
//    data.body = page_data.slice(0, -1);
//    data.ref = current_diff;
//    data.page = page;
//    callback(data);
//  });
//}

// TODO validate workspace (single alphanum token?)
// or use uniqueId()
var makeWorkspace = function(key) {
  var root = global_root_dir + key;
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }
  index = new eph.mkTracker(root);
  workspaces[key] = index;
  return index;
}

var sendmsg = function(ws, obj) {
  ws.send(JSON.stringify(obj));
}

var add_client = function(ws) {
  var id = _.uniqueId();
  clients[id] = {ws: ws};
  return id;
}

var readWorkingFile = function(index, name) {
  if (!index.fileCheck(name)) {
    var content = global_index.readHead(name);
    if (content) {
      index.commitFile(name, content);
    }
  }
  return index.readHead(name);
}
var sendWorkspaceView = function(ws, index, key, name) {
  if (name) {
    var content = readWorkingFile(index, name);
    if (content) {
      sendmsg(ws, {
        tag: 'read',
        data: {
          body: content,
          page: name,
          workspace: key,
      }});
    } else {
      // TODO handle missing file
      // create new file?
    }
  } else {
    // TODO render default workspace view
  }
}

var handleWorkspace = function(ws, data) {
  console.log('WORKSPACE');
  console.log(data);

  var key = data.workspace;
  var index = workspaces[key];
  if (!index) {
    // Make workspace
    console.log('making workspace');
    index = makeWorkspace(key);
  }
  sendWorkspaceView(ws, index, key, data.name);
}

var handleDiff = function(id, ws, data, msg) {
  console.log('DIFF');
  console.log(data);

  var key = data.workspace;
  var index = workspaces[key];
  var name = data.name
  if (index) {
    var ref = index.current(name);
    // This diff is against the current version
    if (ref === data.diff.prev) {
      // Apply diff
      var current_content = index.readHead(name);
      var new_content = d.applyPatch(current_content, data.diff.patch);
      index.commitFile(name, new_content);

      // Distribute diff
      _.each(clients, function(client, id2) {
        if (id !== id2) {
          console.log('SENDING: ', id2);
          sendmsg(client.ws, msg);
        }
      });
    } else {
      // Diff is against conflicting version
      // TODO handle
      // return anti-ack
    }
  } else {
    console.log('diff with bad workspace:', data);
  }
}

var make_server_handlers = function(id, ws) {
  return {
    'workspace': function(data) {
      handleWorkspace(ws, data);
    },
    'diff': function(data, msg) {
      handleDiff(id, ws, data, msg);
    },
    'commit': function(data) {
      handleCommit(ws, data);
    },
  };
}

var start_server = function() {
  //app.get('/page/:page', function(req, res) {
  //  writeFileResponse(res, 'editor.html');
  //});

  // Init
  var app = express();
  app.get('/:ws/:name', function(req, res) {
    writeFileResponse(res, 'static/editor.html');
  });
  app.use(express.static('static'));
  app.use(express.static('pages'));
  var server = http.createServer(app);
  server.listen(4444);

  var wss = new WSS({server: server});
  wss.on('connection', function(ws) {
    var id = add_client(ws);
    console.log('connection: ', id);
    var handlers = make_server_handlers(id, ws);
    ws.on('close', function() {
      console.log('closing: ', id);
      delete clients[id];
    });
    ws.on('message', function(message) {
      var msg = JSON.parse(message);
      util.handle(handlers, msg);
    });
  });
}

start_server();



// TODO delete?
var writeFileResponse = function(res, page) {
  fs.readFile(__dirname + '/' + page, {encoding: 'utf8'},
      function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading ' + page);
        }
        res.writeHead(200);
        res.end(data);
      });
}

