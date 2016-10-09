/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.state.title = '深圳市国信通劳务派遣有限公司';

    ctx.body = ctx.render('apps/index/index');
  }
};
