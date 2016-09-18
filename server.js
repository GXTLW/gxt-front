/**
 * Created by nuintun on 2016/9/18.
 */

const koa = require('koa');
const etag = require('koa-etag');
const send = require('koa-send');
const route = require('koa-route');
const mongoose = require('mongoose');
const session = require('koa-session');
const favicon = require('koa-favicon');
const convert = require('koa-convert');
const responseTime = require('koa-response-time');
const conditionalGET = require('koa-conditional-get');

const app = new koa();

// mongoose.connect('mongodb://localhost/test');

app.keys = ['GXT'];

app.use(responseTime());
app.use(convert(session(app)));
app.use(conditionalGET());
app.use(etag());
app.use(favicon());

app.use(route.get('/', context =>{
  if (!context.session.login) {
    context.session.login = true;
  }

  context.body = 'hello';
}));

app.listen(8080, ()=>{
  console.log('listening on port 8080.');
});
