/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '公司资质';

    ctx.body = ctx.render('apps/about/aptitude');
  }
};
