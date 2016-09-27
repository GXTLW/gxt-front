/**
 * Created by nuintun on 2016/9/26.
 */

module.exports = {
  company: ctx=>{
    console.log('company detail');

    ctx.session.login = 'nuintun';
    ctx.session.password = '8888168';
    ctx.body = JSON.stringify({
      path: ctx.path,
      intro: ctx.model
    }, '&nbsp;', 2);
  },
  trade: ctx=>{
    ctx.body = JSON.stringify({
      path: ctx.path,
      intro: ctx.model
    }, '&nbsp;', 2);
  },
  help: ctx=>{
    ctx.body = JSON.stringify({
      path: ctx.path,
      intro: ctx.model
    }, '&nbsp;', 2);
  },
  policy: ctx=>{
    ctx.body = JSON.stringify({
      path: ctx.path,
      intro: ctx.model
    }, '&nbsp;', 2);
  }
};
