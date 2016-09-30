/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.state.title = '政策法规';

    ctx.body = ctx.render('apps/news/policy');
  }
};
