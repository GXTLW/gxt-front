/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.state.title = '劳务派遣';

    ctx.body = ctx.render('apps/business/index');
  }
};
