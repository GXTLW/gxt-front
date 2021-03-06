/**
 * Created by nuintun on 2016/9/29.
 */

'use strict';

const path = require('path');
const util = require('../lib/util');
const nunjucks = require('nunjucks');

// default options
const defs = {
  root: 'views',
  extname: 'html',
  layout: 'layout/default',
};

/**
 * clone
 * @param object
 * @returns {Object}
 */
function clone(object) {
  return Object.create(object);
}

/**
 * add extname
 * @param view
 * @param extname
 * @returns {*}
 */
function addExt(view, extname) {
  extname = '.' + extname;

  return view.slice(-5).toLowerCase() === extname ? view : view + extname;
}

/**
 * assert
 * @param value
 * @param defs
 * @returns {*}
 */
function assert(value, defs) {
  return value && util.string(value) ? value : defs;
}

/**
 * view engine
 * @param app
 * @param options
 */
module.exports = function(app, options) {
  if (app.context.render) return;

  options = util.extend(true, clone(defs), options);
  options.root = assert(options.root, defs.root);
  options.extname = assert(options.extname, defs.extname);
  options.layout = assert(options.layout, defs.layout);

  // configure nunjucks
  const engine = nunjucks.configure(options.root, clone(options));

  // render function
  app.context.render = function(view, layout) {
    // assert view
    if (!view || !util.string(view)) {
      throw new TypeError('The path of view must be set.');
    }

    var ctx = this;
    // model
    var model = ctx.state || {};

    // add view extname
    view = addExt(view, options.extname);

    // set layout and render view
    if (layout === false) {
      return engine.render(view, model);
    } else {
      model.__BODY__ = view;
      layout = addExt(assert(layout, options.layout), options.extname);

      return engine.render(layout, model);
    }
  };
};
