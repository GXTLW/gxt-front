/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

const fs = require('fs');
const koa = require('koa');
const zlib = require('zlib');
const path = require('path');
const util = require('./lib/util');
const serve = require('./lib/serve');
// const mongoose = require('mongoose');
const session = require('koa-session');
const convert = require('koa-convert');
const router = require('./lib/router')();
const responseTime = require('koa-response-time');

const cwd = util.cwd;
const app = new koa();
const statics = 'public';
const maxAge = 365 * 24 * 60 * 60;

if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development') {
  // onerror
  require('koa-onerror')(app);
}

// mongoose.connect('mongodb://localhost/test');

// cookies secret key
app.keys = ['GXT', '8888168'];

// response time
app.use(responseTime());
// session
router.use(convert(session(app, { key: 'GXT', maxAge: maxAge })));
//
function stat(file){
  return function (fn){
    fs.stat(file, fn);
  }
}
router.use(convert(function*(next){
  var ctx = this;
  var stats = yield stat('app.js');

  console.log('resource', ctx.routerPath);
  console.log('resource', ctx.captures);

  yield next;
}));
// routers
app.use(router.routes());

if (util.env.development) {
  // statics serve
  app.use(serve(statics, path.join(cwd, statics)));
} else {
  // statics serve
  app.use(serve(statics, path.join(cwd, statics), { maxAge: maxAge }));
  // compress
  app.use(require('koa-compress')());
}

var server = app.listen(8080, ()=>{
  var address = server.address();

  console.log('listening on port ' + address.port + '.');
});
