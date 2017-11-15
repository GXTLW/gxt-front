/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '行业新闻';

    ctx.body = ctx.render('apps/news/trade');
  }
};
