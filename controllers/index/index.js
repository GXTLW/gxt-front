/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.layout = '';
    ctx.body = ctx.render('apps/index/index');
  }
};
