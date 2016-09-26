/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = [
  {
    route: '/cooperation',
    action: ctx=>{
      ctx.body = ctx.path;
    }
  }
];
