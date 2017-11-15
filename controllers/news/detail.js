/**
 * Created by nuintun on 2016/9/26.
 */

'use strict';

const convert = require('koa-convert');
const detail = require('../../lib/detail-util');

module.exports = {
  company: convert(function*() {
    var ctx = this;

    ctx.state.title = '公司新闻';

    yield detail.render(ctx, 'apps/news/news-' + ctx.params.id);
  }),
  trade: convert(function*() {
    var ctx = this;

    ctx.state.title = '行业新闻';

    yield detail.render(ctx, 'apps/news/trade-' + ctx.params.id);
  }),
  help: convert(function*() {
    var ctx = this;

    ctx.state.title = '派遣知识';

    yield detail.render(ctx, 'apps/news/help-' + ctx.params.id);
  }),
  policy: convert(function*() {
    var ctx = this;

    ctx.state.title = '政策法规';

    yield detail.render(ctx, 'apps/news/policy-' + ctx.params.id);
  })
};
