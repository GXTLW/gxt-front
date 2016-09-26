/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = [
  {
    route: '/contact/join',
    action: ctx=>{
      ctx.body = ctx.path;
    }
  }
];
