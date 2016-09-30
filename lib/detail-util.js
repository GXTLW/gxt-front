/**
 * Created by nuintun on 2016/9/30.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('./util');
const config = require('../config');
const thunkify = require('thunkify');
const convert = require('koa-convert');

const fstat = thunkify(fs.stat);

/**
 * file exists
 * @param src
 * @param base
 * @returns {boolean}
 */
function* fexists(src, base){
  try {
    var stats = yield fstat(path.join(util.cwd, base || '', src));

    if (stats && stats.isFile()) {
      return true;
    }
  } catch (error) {
    // stat error
  }

  return false;
}

function* findView(view){
  return (yield fexists(view + '.' + config.view_ext, config.view_base)) ? view : null;
}

module.exports = {
  render: function*(ctx, view){
    view = yield findView(view);

    if (view !== null) {
      var model = ctx.state || {};
      var style_path = path.join(path.dirname(config.style_base), view + '.css');
      var script_path = path.join(path.dirname(config.script_base), view + '.js');

      model.style = (yield fexists(style_path)) ? style_path : '';
      model.script = (yield fexists(script_path)) ? script_path : '';

      ctx.body = ctx.render(view);
    }
  }
};
