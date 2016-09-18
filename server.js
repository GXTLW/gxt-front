/**
 * Created by nuintun on 2016/9/18.
 */

const koa = require('koa');
const path = require('path');
const send = require('koa-send');
const router = require('koa-router');
// const mongoose = require('mongoose');
const session = require('koa-session');
const convert = require('koa-convert');
const responseTime = require('koa-response-time');

const app = new koa();
const route = router();
const assets = 'Assets';
const cwd = process.cwd();
const maxAge = 365 * 24 * 60 * 60;

// mongoose.connect('mongodb://localhost/test');

function serve(path, root, options){
  // remove / begin
  path = path.replace(/^\/+/, '');
  options = options || {};
  options.root = root || cwd;

  return function (ctx, next){
    if (ctx.method == 'HEAD' || ctx.method == 'GET') {

      let req_path_array = ctx.path.slice(1).split('/');

      // match path
      if (path.length == 0 || path == req_path_array[0]) {
        // if not serve the root
        // then remove the filtered folder from path
        if (path.length != 0) {
          req_path_array = req_path_array.slice(1);
        }

        return send(ctx, req_path_array.join('/') || '/', options).then(() =>{
          return next();
        });
      }
    }

    return next();
  };
}

app.keys = ['GXT'];

// response time
app.use(responseTime());
// session
app.use(convert(session(app)));
// assets
app.use(serve(assets, path.join(cwd, assets), { gzip: true }));

route.get('/', ctx=>{
  if (!ctx.session.login) {
    ctx.session.login = true;
  }

  ctx.body = 'hello';
});

app.use(route.routes());

app.listen(8080, ()=>{
  console.log('listening on port 8080.');
});
