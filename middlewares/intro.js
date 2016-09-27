/**
 * Created by nuintun on 2016/9/27.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('../lib/util');
const thunkify = require('thunkify');
const convert = require('koa-convert');
const fstat = thunkify(fs.stat);

/**
 * file exists
 * @param src
 * @returns {boolean}
 */
function* fexists(src){
  try {
    var stats = yield fstat(path.join(util.cwd, src));

    if (stats && stats.isFile()) {
      return true;
    }
  } catch (error) {
    // stat error
  }

  return false;
}

/**
 * controllerto id
 * @param controller
 * @param controller_base
 * @returns {string}
 */
function controller2id(controller, controller_base){
  return path.relative(controller_base, controller).slice(0, -3);
}

/**
 * id to src
 * @param src
 * @param src_base
 * @param ext
 * @returns {string}
 */
function id2src(src, src_base, ext){
  return util.normalize(path.join(src_base, src + ext));
}

/**
 * assert
 * @param value
 * @param defs
 */
function assert(value, defs){
  if (!value || util.string(value)) {
    return defs;
  } else {
    return value;
  }
}

// exports
module.exports = function (controller_base, style_base, script_base){
  controller_base = assert(controller_base, 'controllers');
  style_base = assert(controller_base, '/public/style/default/apps');
  script_base = assert(controller_base, '/public/script/apps');

  // middleware
  return convert(function*(next){
    var ctx = this;
    var model = ctx.model || {};
    /** @namespace ctx.routeData.controller */
    var id = controller2id(ctx.routeData.controller, controller_base);

    var style_src = id2src(id, style_base, '.css');
    var script_src = id2src(id, script_base, '.js');

    model.style = (yield fexists(style_src)) ? style_src : '';
    model.script = (yield fexists(script_src)) ? script_src : '';

    // set model
    ctx.model = model;

    yield next;
  });
};
