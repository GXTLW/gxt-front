/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.state.title = '招牌信息';

    ctx.body = ctx.render('apps/jobs/index');
  }
};
