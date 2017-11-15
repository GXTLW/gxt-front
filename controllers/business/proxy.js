/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '人事代理';

    ctx.body = ctx.render('apps/business/proxy');
  }
};
