var createError = require('http-errors');
var express = require('express');
var path = require('path');
var  controllerMongo      = require( './Controllers/mongo-controller.js' );


"use strict";
// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'graph-socket-server';
// Port where we'll run the websocket server
var webSocketsServerPort = 8087;
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var clients = [];

var server = http.createServer(function (request, response) {

});

server.listen(webSocketsServerPort, function () {
  console.log((new Date()) + " Server is listening on port " +
    webSocketsServerPort);
});

var wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', function (request) {
  console.log((new Date()) + ' Connection from origin ' +
    request.origin + '.');

  var connection = request.accept(null, request.origin);
  // we need to know client index to remove them on 'close' event
  var index = clients.push(connection) - 1;

  console.log((new Date()) + ' Connection accepted.');

  var sendingUserListInterval = setInterval(function () {

    controllerMongo.getAllUserDetailsToGraph(connection);
    console.log("sent");

  }, 1000);

  // user disconnected
  connection.on('close', function (connection) {
    // remove user from the list of connected clients
    clearInterval(sendingUserListInterval);
    clients.splice(index, 1);
  });
});