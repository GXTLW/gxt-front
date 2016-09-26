/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = [
  {
    route: '/news/trade',
    action: ctx=>{
      ctx.body = ctx.path;
    }
  },
  {
    route: '/news/trade/:id',
    action: ctx=>{
      ctx.body = ctx.path;
    }
  }
];
