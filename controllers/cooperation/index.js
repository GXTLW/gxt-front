/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '加盟合作';

    ctx.body = ctx.render('apps/cooperation/index');
  }
};
