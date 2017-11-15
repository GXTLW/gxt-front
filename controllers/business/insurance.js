/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx => {
    ctx.state.title = '代缴社保';

    ctx.body = ctx.render('apps/business/insurance');
  }
};
