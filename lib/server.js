/*
 *  Server
 *
 *  function createServer() 
 *  returns - Slice-N-Dice image resizing server.
 *
 */

var url = require('url');
var util = require("util");
var http = require('http');
var domain = require('domain');
var resizeStream = require('./resize_stream');

var DEFAULT_MAX_SOCKETS = 20000;
var REQ_TIMEOUT = 25000;

exports.createServer = function(o){
  return new ResizingService(o);
};

var ResizingService = function(o){
  o = o || {};
  http.Server.call(this);
  this.agent = new http.Agent();
  this.agent.maxSockets = o.maxSockets || DEFAULT_MAX_SOCKETS;
  this.graceful_shutdown = false;
  this.bindEventListeners();
};

util.inherits(ResizingService,http.Server);

ResizingService.prototype.bindEventListeners = function(req,res){
  this.on('request', this.onRequest.bind(this));
  this.on('close', this.onClose.bind(this));
  this.on('connect', this.onConnect.bind(this));
  this.on('clientError',function(e){
    console.log('client error',e);
  });
  this.on('error',function(e){
    console.log('server error',e);
  });
};

ResizingService.prototype.onRequestWithDomain = function(req,res){
  console.log('received request',req.url);
  var server = this; 
  var timeout_id = server.setTimeout();
  var d = domain.create();
  
  res.once('finish',function(){
    clearTimeout(timeout_id);
    d.dispose();
  });

  d.add(req);
  d.add(res);

  d.on('error',function(err){
    server.onError(err,req,res,d);
  });

  d.run(function(){
    if(server.graceful_shutdown) return server.respond503(req,res); 
    server.respondResize(req,res);
  });
};


ResizingService.prototype.onRequest = function(req,res){
  console.log('received request',req.url);
  var server = this; 
  var timeout_id = server.setTimeout();
  
  res.once('finish',function(){
    clearTimeout(timeout_id);
  });

  if(server.graceful_shutdown) return server.respond503(req,res); 
  server.respondResize(req,res);
};

ResizingService.prototype.respondResize = function(req,res){
  var time = Date.now();
  var params = url.parse(req.url,true).query;
  var img_url = params.u;

  if(req.method !== 'GET') return this.respond405(req,res);
  if(!img_url && !params.w && !params.h) return this.respond400(req,res);

  var fetch_options = url.parse(img_url);
  fetch_options.agent = this.agent;
  
  var fetch = http.get(fetch_options, function(fetch_res){
    console.log('fetch time', Date.now()-time);
    resizeStream(params,fetch_res,function(err,img_stream){
      img_stream.pipe(res); 
    });
  });
};

ResizingService.prototype.setTimeout = function(){
  return setTimeout(function(){
    console.log("timeout");
    throw Error('Request timed out');
  },REQ_TIMEOUT);
};

ResizingService.prototype.onError = function(err,req,res,d){
  console.error('REQUEST ERR:',req.url);
  if(err.code) console.error(err.code);
  console.error(err.stack);
  try{
    console.log('trying to error request cleanly');
    this.respond500(req,res);
  } catch (e){
    console.error('Error sending 500', e, req.url);
    if(e.code) console.error(e.code);
    console.error(e.stack);
    d.dispose();
    console.log('disposed on error');
  }
};

ResizingService.prototype.onClose = function(req,res){
  this.graceful_shutdown = true;
  console.log('graceful shutdown of resizer');
};

ResizingService.prototype.onConnect= function(socket){
  console.log('resizer connected',socket.address());
};

ResizingService.prototype.respond400 = function(req,res){
  res.writeHead(400);
  res.end();
};

ResizingService.prototype.respond404 = function(req,res){
  res.writeHead(404);
  res.end();
};

ResizingService.prototype.respond405 = function(req,res){
  res.writeHead(405,{'Allow':'GET'});
  res.end();
};

ResizingService.prototype.respond500 = function(req,res){
  res.writeHead(500);
  res.end();
};

ResizingService.prototype.respond503 = function(req,res){
  res.writeHead(503,{'connection':'close'});
  res.end();
};
