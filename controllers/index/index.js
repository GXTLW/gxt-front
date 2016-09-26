/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

module.exports = {
  index: ctx=>{
    console.log('/index');

    ctx.session.login = 'nuintun';
    ctx.session.password = '8888168';

    ctx.body = ctx.path;
  }
};
