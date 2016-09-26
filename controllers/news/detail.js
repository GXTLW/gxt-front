/**
 * Created by nuintun on 2016/9/26.
 */

module.exports = {
  company: ctx=>{
    console.log('company detail');

    ctx.session.login = 'nuintun';
    ctx.session.password = '8888168';
    ctx.body = 'detail: ' + ctx.path;
  },
  trade: ctx=>{
    ctx.body = 'detail: ' + ctx.path;
  },
  help: ctx=>{
    ctx.body = 'detail: ' + ctx.path;
  },
  policy: ctx=>{
    ctx.body = 'detail: ' + ctx.path;
  }
};
