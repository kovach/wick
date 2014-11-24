var _ = require('underscore');
var WSS = require('ws').Server;
var fs = require('fs');
var express = require('express');
var http = require('http');

var touchFile = function(file_path) {
  fs.appendFile(file_path, '');
}

var writeFile = function(res, page) {
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

var readPage = function(page, callback) {
  var file_path = __dirname + '/pages/' + page;
  // Create if not existent
  console.log(file_path);
  touchFile(file_path);
  fs.readFile(file_path, {encoding: 'utf8'},
      function(err, page_data) {
        if (err) {
          console.log(err);
        } else {
          callback(page_data);
        }
      });
}

var sendmsg = function(ws, obj) {
  ws.send(JSON.stringify(obj));
}

var clients = {};
var add_client = function(ws) {
  var id = _.uniqueId();
  clients[id] = {ws: ws};
  return id;
}
var start_server = function() {
  var app = express();
  app.get('/page/:page', function(req, res) {
    writeFile(res, 'editor.html');
  });
  app.use(express.static('.'));
  var server = http.createServer(app);
  server.listen(4444);

  var wss = new WSS({server: server});
  wss.on('connection', function(ws) {
    var id = add_client(ws);
    console.log('connection: ', id);

    ws.on('close', function() {
      console.log('closing: ', id);
      delete clients[id];
    });

    ws.on('message', function(message) {
      var msg = JSON.parse(message);
      switch (msg.tag) {
        case 'diff':
          console.log('DIFF');
          console.log(msg.data);
          _.each(clients, function(client, id2) {
            if (id !== id2) {
              client.ws.send(message);
            }
          });
          break;
        case 'read':
          console.log('READ');
          readPage(msg.data, function(data) {
            sendmsg(ws, {tag: 'read', data: data});
          })
          break;
      }
    });
  });
}
start_server();
