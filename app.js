/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

const fs = require('fs');
const koa = require('koa');
const zlib = require('zlib');
const path = require('path');
const config = require('./config');
const util = require('./lib/util');
const thunkify = require('thunkify');
const favicon = require('koa-favicon');
// const mongoose = require('mongoose');
const session = require('koa-session');
const convert = require('koa-convert');
const serve = require('./middlewares/serve');
const intro = require('./middlewares/intro');
const engine = require('./middlewares/engine');
const responseTime = require('koa-response-time');
const interceptors = require('koa-interceptors')();

const cwd = util.cwd;
const app = new koa();
const statics = 'public';
const maxAge = 365 * 24 * 60 * 60;

if (process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development') {
  // onerror
  require('koa-onerror')(app);
  // set engine
  engine(app, { watch: true, root: config.view_base, extname: config.view_ext });
} else {
  // set engine
  engine(app, { root: config.view_base, extname: config.view_ext });
}

// mongoose.connect('mongodb://localhost/test');

// cookies secret key
app.keys = ['GXT', '8888168'];

// response time
app.use(responseTime());
// session
interceptors.use(convert(session(app, { key: 'GXT', maxAge: maxAge })));
// resource
interceptors.use(intro(config));
// routers
app.use(interceptors.routes());
// favicon
app.use(favicon('favicon.ico'));

// statics serve
if (util.env.development) {
  app.use(serve(statics, path.join(cwd, statics)));
} else {
  app.use(serve(statics, path.join(cwd, statics), { maxAge: maxAge }));
  // compress
  app.use(require('koa-compress')());
}

// error handler
app.on('error', (error, ctx)=>{
  // do nothing
});

// exports
module.exports = app;
