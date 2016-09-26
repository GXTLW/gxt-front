/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.session.login = 'nuintun';
    ctx.session.password = '8888168';

    ctx.body = ctx.path;
  }
};
