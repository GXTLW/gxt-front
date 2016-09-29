/**
 * Created by nuintun on 2016/9/29.
 */

'use strict';

const path = require('path');
const util = require('../lib/util');
const nunjucks = require('nunjucks');

// default options
const defs = {
  extname: '.html',
  root: 'views',
  layout: 'layout/default',
};

/**
 * clone
 * @param object
 * @returns {Object}
 */
function clone(object){
  return Object.create(object);
}

/**
 * add extname
 * @param view
 * @param extname
 * @returns {*}
 */
function addExt(view, extname){
  return view.slice(-5).toLowerCase() === extname ? view : view + extname;
}

/**
 * assert
 * @param value
 * @param defs
 * @returns {*}
 */
function assert(value, defs){
  return value && util.string(value) ? value : defs;
}

/**
 * view engine
 * @param app
 * @param options
 */
module.exports = function (app, options){
  if (app.context.render) return;

  options = util.extend(true, clone(defs), options);
  options.root = assert(options.root, defs.root);
  options.extname = assert(options.extname, defs.extname);
  options.layout = assert(options.layout, defs.layout);

  // configure nunjucks
  const engine = nunjucks.configure(options.root, clone(options));

  // render function
  app.context.render = function (view){
    var ctx = this;

    // assert view
    if (!view || !util.string(view)) {
      throw new TypeError('The path of view must be set.');
    }

    // add view extname
    view = addExt(view, options.extname);

    // set layout
    if (!ctx.hasOwnProperty('layout') || ctx.layout) {
      ctx.model.layout = addExt(assert(ctx.layout, options.layout), options.extname);
    }

    // render view
    return engine.render(view, ctx.model);
  };
};
