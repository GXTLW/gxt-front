/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '派遣知识';

    ctx.body = ctx.render('apps/news/help');
  }
};
