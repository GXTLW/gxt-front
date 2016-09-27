/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

const fs = require('fs');
const koa = require('koa');
const zlib = require('zlib');
const path = require('path');
const util = require('./lib/util');
const thunkify = require('thunkify');
// const mongoose = require('mongoose');
const session = require('koa-session');
const convert = require('koa-convert');
const serve = require('./middlewares/serve');
const responseTime = require('koa-response-time');
const interceptors = require('koa-interceptors')();

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
interceptors.use(convert(session(app, { key: 'GXT', maxAge: maxAge })));
// resource
const fstat = thunkify(fs.stat);

interceptors.use(convert(function*(next){
  var ctx = this;
  var model = ctx.model || {};
  var src = path.relative('controllers', ctx.controller).slice(0, -3);

  console.log('router:', ctx.router);
  console.log('controller:', ctx.controller);
  console.log('action:', ctx.action);

  var style_src = util.normalize(path.join('public/style/default/apps', src + '.css'));
  var script_src = util.normalize(path.join('public/script/apps', src + '.js'));

  try {
    var style_stats = yield fstat(path.join(cwd, style_src));

    if (style_stats && style_stats.isFile()) {
      model.style = style_src;
    }
  } catch (e) {
    model.style = '';
  }

  try {
    var script_stats = yield fstat(path.join(cwd, script_src));

    if (script_stats && script_stats.isFile()) {
      model.script = script_src;
    }
  } catch (e) {
    model.script = '';
  }

  console.log('model', JSON.stringify(model, null, 2));

  yield next;
}));
// routers
app.use(interceptors.routes());

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
