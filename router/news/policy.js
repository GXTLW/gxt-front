/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  '/news/policy': ctx=>{
    ctx.session.login = 'nuintun';
    ctx.session.password = '8888168';

    ctx.body = 'hello world!';
  },
  '/news/policy/:id': ctx=>{
    ctx.session.login = 'nuintun';
    ctx.session.password = '8888168';

    ctx.body = 'hello world!';
  },
};
