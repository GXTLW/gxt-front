/**
 * Created by nuintun on 2016/9/30.
 */

'use strict';

const convert = require('koa-convert');
const detail = require('../../lib/detail-util');

module.exports = {
  index: convert(function*() {
    var ctx = this;

    ctx.state.title = '招聘信息';

    yield detail.render(ctx, 'apps/jobs/job-' + ctx.params.id);
  })
};
