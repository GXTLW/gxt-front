/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.model.title = '国信通';
    ctx.model.version = ctx.version;

    ctx.body = ctx.render('apps/index/index');
  }
};
