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
 * id to path
 * @param src
 * @param src_base
 * @param ext
 * @returns {string}
 */
function id2path(src, src_base, ext){
  return util.path2cwd(path.join(src_base, src + ext));
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
module.exports = function (config){
  config = config || {};

  var version = Date.now();
  var controller_base = util.realpath(assert(config.controller_base, '/controllers'));
  var style_base = util.realpath(assert(config.style_base, '/public/style/default/apps'));
  var script_base = util.realpath(assert(config.script_base, '/public/script/apps'));

  // middleware
  return convert(function*(next){
    var ctx = this;
    var model = ctx.state || {};
    /** @namespace ctx.routeData.controller */
    var id = controller2id(util.realpath(ctx.routeData.controller), controller_base);

    var style_path = id2path(id, style_base, '.css');
    var script_path = id2path(id, script_base, '.js');

    model.nav = id.split(/[/\\]/)[0];
    model.title = model.title || config.title;
    model.version = config.version || version;
    model.style = (yield fexists(style_path)) ? style_path : '';
    model.script = (yield fexists(script_path)) ? script_path : '';

    // set model
    ctx.state = model;

    yield next;
  });
};
