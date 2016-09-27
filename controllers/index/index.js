/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.session.login = 'nuintun';
    ctx.session.password = '8888168';

    ctx.body = JSON.stringify({
      path: ctx.path,
      intro: ctx.model
    }, '&nbsp;', 2);
  }
};
