/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '联系我们';

    ctx.body = ctx.render('apps/contact/index');
  }
};
