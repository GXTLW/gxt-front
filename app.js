/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

const koa = require('koa');
const path = require('path');
const send = require('koa-send');
const router = require('koa-router');
// const mongoose = require('mongoose');
const session = require('koa-session');
const convert = require('koa-convert');
const onerror = require('koa-onerror');
const responseTime = require('koa-response-time');

const app = new koa();
const route = router();
const statics = 'public';
const cwd = process.cwd();
const maxAge = 365 * 24 * 60 * 60;

// onerror
onerror(app);

// mongoose.connect('mongodb://localhost/test');

/**
 * serve
 * @param path
 * @param root
 * @param options
 * @returns {Function}
 */
function serve(path, root, options){
  // remove / begin
  path = path.replace(/^\/+/, '');
  options = options || {};
  options.root = root || cwd;

  return function (ctx, next){
    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      let req_path_array = ctx.path.slice(1).split('/');

      // match path
      if (path.length === 0 || path === req_path_array[0]) {
        // if not serve the root
        // then remove the filtered folder from path
        if (path.length !== 0) {
          req_path_array = req_path_array.slice(1);
        }

        return send(ctx, req_path_array.join('/') || '/', options).then(()=>{
          return next();
        });
      }
    }

    return next();
  };
}

// cookies secret key
app.keys = ['GXT', '8888168'];

// response time
app.use(responseTime());
// session
app.use(convert(session(app, { key: 'GXT', maxAge: maxAge })));
// route
app.use(route.routes());

route.get('/', ctx=>{

});

// statics serve
app.use(serve(statics, path.join(cwd, statics), { gzip: true }));

var server = app.listen(8080, ()=>{
  var address = server.address();

  console.log('listening on port ' + address.port + '.');
});
