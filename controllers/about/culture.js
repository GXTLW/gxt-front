/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '公司文化';

    ctx.body = ctx.render('apps/about/culture');
  }
};
