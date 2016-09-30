/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.state.title = '公司新闻';

    ctx.body = ctx.render('apps/news/index');
  }
};
