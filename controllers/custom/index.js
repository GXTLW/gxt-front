/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '合作客户';

    ctx.body = ctx.render('apps/custom/index');
  }
};
