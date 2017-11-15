/**
 * Created by nuintun on 2016/9/19.
 */

'use strict';

// external lib
var os = require('os');
var http = require('http');
var app = require('./app');
var cluster = require('cluster');

// variable declaration
var NUMCPUS = os.cpus().length;
var localhost = ['::', '127.0.0.1', 'localhost'];

function run() {
  if (cluster.isMaster) {
    // worker
    var worker;

    // create thread
    for (var i = 0; i < NUMCPUS; i++) {
      // fork
      worker = cluster.fork();

      // listen event
      worker.on('message', function(message) {
        console.log(message);
      });
    }
  } else {
    // create server
    var server = http.createServer(app.callback());

    // start listening
    server.on('listening', function() {
      var address = server.address();
      var port = address.port;
      var host = localhost.indexOf(address.address) !== -1 ? '127.0.0.1' : address.address;

      // logger
      process.send(
        'Server thread '
        + cluster.worker.id
        + ' runing at: '
        + host
        + ':'
        + port
      );
    });

    // error
    server.on('error', function() {
      // exit
      process.exit();
    });

    // close
    server.on('close', function() {
      // exit
      process.exit();
    });

    // listen
    server.listen(process.env.PORT || 8080);

    // return
    return server;
  }
}

run();
