/**
 * Created by nuintun on 2016/9/18.
 */

const koa = require('koa');
const path = require('path');
const router = require('koa-router');
// const mongoose = require('mongoose');
const session = require('koa-session');
const convert = require('koa-convert');
const staticCache = require('koa-static-cache');
const responseTime = require('koa-response-time');

const app = new koa();
const route = router();
const cwd = process.cwd();
const maxAge = 365 * 24 * 60 * 60;
const assets = path.join(cwd, 'Assets');

// mongoose.connect('mongodb://localhost/test');

app.keys = ['GXT'];

app.use(responseTime());
app.use(convert(staticCache(cwd, { maxAge: maxAge, dynamic: true })));
app.use(convert(session(app)));

route.get('/', context =>{
  if (!context.session.login) {
    context.session.login = true;
  }

  context.body = 'hello';
});

app.use(route.routes());

app.listen(8080, ()=>{
  console.log('listening on port 8080.');
});
