var _ = require('underscore');
var WSS = require('ws').Server;
var fs = require('fs');
var express = require('express');
var http = require('http');


var sendFile = function(res, page) {
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

var pair = function(a, b) {
  return {pattern: a, handler: b};
}
var routes = [
  pair(/^\/page\/(\w*)$/, function(page) {
    // Open edit page for 'page'
    this.writeHead(200);
    this.end('wiki page: ' + page);
  }),
  pair(/^\/cm\/((?:\w|\/)\.?\w*)$/, function(file) {
    sendFile(this, file);
  }),
  pair(/^\/$/, function() {
    sendFile(this, 'test.html');
  }),
  pair(/^\/(\w*\.?\w*)$/, function(page) {
    sendFile(this, page);
  }),
  ];

//var handler = function (req, res) {
//  var success =
//    _.find(routes, function(pair) {
//      var match = req.url.match(pair.pattern);
//      if (match) {
//        pair.handler.apply(res, match.slice(1));
//        return true;
//      }
//    });
//  if (!success) {
//    res.writeHead(404);
//    res.end('404');
//  }
//}

var clients = [];
var add_client = function(ws) {
  var id = _.uniqueId();
  clients[id] = {ws: ws};
  return id;
}
var start_server = function() {
  var app = express();
  app.get('/page/:page', function(req, res) {
    // TODO load editor.html, set content, ???
    console.log('page');
    res.send(req.params.page);
  });
  app.use(express.static('.'));
  var server = http.createServer(app);
  server.listen(4444);

  var wss = new WSS({server: server});
  wss.on('connection', function(ws) {
    var id = add_client(ws);
    console.log('connection: ', id);
    ws.on('message', function(message) {
      var msg = JSON.parse(message);
      switch (msg.tag) {
        case 'diff':
          console.log('DIFF');
          console.log(msg.data);
          break;
      }
    });
  });
}
start_server();

//var app = require('http').createServer(handler); app.listen(4444);

