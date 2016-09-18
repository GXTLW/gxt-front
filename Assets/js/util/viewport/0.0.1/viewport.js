/*!
 * viewport
 * Version: 0.0.1
 * Date: 2016/7/21
 * https://github.com/Nuintun/viewport
 *
 * Original Author: http://www.jsbug.com/lab/samples/viewport/
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/Nuintun/viewport/blob/master/LICENSE
 */

'use strict';

var is = require('./is');
var $ = require('jquery');

// id expando
var expando = 0;

/**
 * patch the threshold like css
 * - 1            ==> top: 1, right: 1, bottom: 1, left: 1
 * - [1]          ==> top: 1, right: 1, bottom: 1, left: 1
 * - [1, 2]       ==> top: 1, right: 2, bottom: 1, left: 2
 * - [1, 2, 3]    ==> top: 1, right: 2, bottom: 3, left: 2
 * - [1, 2, 3, 4] ==> top: 1, right: 2, bottom: 3, left: 4
 * @param threshold
 * @param absolute
 * @returns {*}
 */
function patchThreshold(threshold, absolute){
  if (is.number(threshold) && !is.nan(threshold) && !is.infinite(threshold)) {
    if (absolute) {
      threshold = Math.abs(threshold);
    }

    threshold = [threshold, threshold, threshold, threshold];
  } else if (is.array(threshold)) {
    var value;
    var set = [];
    var length = threshold.length;

    for (var i = 0; i < length; i++) {
      if (set.length < 4) {
        value = threshold[i];

        if (is.number(value) && !is.nan(value) && !is.infinite(value)) {
          set.push(absolute ? Math.abs(value) : value);
        }
      } else {
        break;
      }
    }

    switch (set.length) {
      case 0:
        threshold = [0, 0, 0, 0];
        break;
      case 1:
        threshold = [set[0], set[0], set[0], set[0]];
        break;
      case 2:
        threshold = [set[0], set[1], set[0], set[1]];
        break;
      case 3:
        threshold = [set[0], set[1], set[2], set[1]];
        break;
      default:
        threshold = set;
        break;
    }
  } else {
    threshold = [0, 0, 0, 0];
  }

  return threshold;
}

/**
 * patch the viewport if it is the window object
 * @param viewport
 * @returns {*}
 */
function patchViewport(viewport){
  return viewport === window
    ? (document.compatMode === 'CSS1Compat' ? document.documentElement : document.body)
    : viewport;
}

/**
 * Viewport
 * @param viewport
 * @param options
 * @constructor
 */
function Viewport(viewport, options){
  if (window !== window && is.element(viewport)) {
    throw new Error('Viewport must be window or a HTMLElement');
  }

  var context = this;

  context.events = {};
  context.id = expando++;
  context.viewport = $(viewport);
  context.__viewport = $(patchViewport(viewport));

  // init
  context.__initOptions(options);
  context.__findTarget();
  context.__init();
}

/**
 * @type {{
 *   __initOptions: Viewport.__initOptions,
 *   __findTarget: Viewport.__findTarget,
 *   __filterTargetInViewport: Viewport.__filterTargetInViewport,
 *   __changeViewport: Viewport.__changeViewport,
 *   __init: Viewport.__init,
 *   on: Viewport.on,
 *   off: Viewport.off,
 *   emit: Viewport.emit,
 *   refresh: Viewport.refresh,
 *   destroy: Viewport.destroy
 * }}
 */
Viewport.prototype = {
  __initOptions: function (options){
    options = $.extend({
      delay: 150,
      target: null,
      threshold: 0,
      skipHidden: true,
      thresholdBorderReaching: 0
    }, options);

    options.delay = Math.max(0, options.delay);
    options.threshold = patchThreshold(options.threshold);
    options.thresholdBorderReaching = patchThreshold(options.thresholdBorderReaching, true);

    this.options = options;
  },
  __findTarget: function (){
    var context = this;
    var options = context.options;
    var target = options.target;
    var __viewport = context.__viewport;

    if (is.string(target)) {
      target = __viewport.find(target);
    } else if (is.element(target) && $.contains(__viewport[0], target)) {
      target = $(target);
    } else if (target instanceof $) {
      target = target.filter(function (){
        return $.contains(__viewport[0], this);
      });
    } else {
      target = null;
    }

    context.target = target;
  },
  __filterTargetInViewport: function (width, height){
    var result = [];
    var context = this;
    var target = context.target;

    // target is not a jquery object or length is zero
    if (!(target instanceof $) || target.length === 0) return result;

    var options = context.options;
    var threshold = options.threshold;
    var skipHidden = options.skipHidden;

    // offsetTop and offsetLeft
    var offsetTop = 0;
    var offsetLeft = 0;
    var viewport = context.viewport;

    // if not window adjust the offsetTop and offsetLeft
    if (viewport[0] !== window) {
      var viewportRect = viewport[0].getBoundingClientRect();

      offsetTop = viewportRect.top + (Math.round(parseFloat(viewport.css('border-top-width'))) || 0);
      offsetLeft = viewportRect.left + (Math.round(parseFloat(viewport.css('border-left-width'))) || 0);
    }

    // filter elements by their rect info
    target.each(function (index, element){
      var rect = element.getBoundingClientRect();

      // hidden element
      if (rect.top == 0 && rect.bottom == 0 && rect.left == 0 && rect.right == 0) {
        if (!skipHidden) {
          result.push(element);
        }
      } else {
        // visible element
        var top = rect.top - offsetTop;
        var bottom = rect.bottom - offsetTop;
        var left = rect.left - offsetLeft;
        var right = rect.right - offsetLeft;

        // adjust position
        if (
          !(top - threshold[2] >= height
          || right + threshold[3] <= 0
          || bottom + threshold[0] <= 0
          || left - threshold[1] >= width)
        ) {
          result.push(element);
        }
      }
    });

    return result;
  },
  __changeViewport: function (emitter, vertical, horizontal){
    var context = this;
    var options = context.options;
    var viewport = context.viewport;
    var __viewport = context.__viewport;
    var thresholdBorderReaching = options.thresholdBorderReaching;

    if (viewport[0] !== window && !viewport.is(':visible')) return;

    var width = viewport.innerWidth();
    var height = viewport.innerHeight();
    var scrollWidth = __viewport[0].scrollWidth;
    var scrollHeight = __viewport[0].scrollHeight;

    // event
    var event = {};

    // scrollbar position
    event.scrollTop = viewport.scrollTop();
    event.scrollLeft = viewport.scrollLeft();
    event.offsetY = event.scrollTop - vertical;
    event.offsetX = event.scrollLeft - horizontal;

    // emitter
    event.emitter = emitter;

    // event type
    event.type = 'viewchange';

    // viewport size infos
    event.viewport = [width, height, scrollWidth, scrollHeight];

    // target
    event.target = context.__filterTargetInViewport(width, height);

    // calculate viewport border reaching detail infos
    event.top = event.scrollTop - thresholdBorderReaching[0] <= 0;
    event.right = width + event.scrollLeft + thresholdBorderReaching[1] >= scrollWidth;
    event.bottom = height + event.scrollTop + thresholdBorderReaching[2] >= scrollHeight;
    event.left = event.scrollLeft - thresholdBorderReaching[3] <= 0;

    // emit view change event
    context.emit(event.type, event);

    // return scrollbar position
    return event;
  },
  __init: function (){
    // delay trigger the scroll and resize event.
    var context = this;
    var id = context.id;
    var options = context.options;
    var viewport = context.viewport;
    var scrollTop = viewport.scrollTop();
    var scrollLeft = viewport.scrollLeft();
    var namespace = '.viewport-' + id;

    // change viewport
    function changeViewport(e){
      // trigger the viewchange event internally.
      var event = context.__changeViewport(e.type, scrollTop, scrollLeft);

      // cahce scroll position
      if (event) {
        scrollTop = event.scrollTop;
        scrollLeft = event.scrollLeft;
      }
    }

    // event handler
    var handler;

    // delay
    if (options.delay) {
      var timer;

      // handler
      handler = function (e){
        // clear timer
        clearTimeout(timer);

        // delay execute
        timer = setTimeout(function (){
          changeViewport(e);
        }, options.delay);
      };
    } else {
      handler = changeViewport;
    }

    // bind event
    viewport.on('scroll' + namespace + ' resize' + namespace, handler);

    // init event
    context.__changeViewport('init', scrollTop, scrollLeft);
  },
  on: function (event, handler){
    var context = this;

    context.events[event] = context.events[event]
      || $.Callbacks('memory stopOnFalse');

    context.events[event].add(handler);

    return context;
  },
  off: function (event, handler){
    var context = this;

    switch (arguments.length) {
      case 0:
        context.events = {};
        break;
      case 1:
        delete context.events[event];
        break;
      default:
        context.events[event] && context.events[event].remove(handler);
        break;
    }

    return context;
  },
  emit: function (event){
    var context = this;
    var data = [].slice.call(arguments, 1);

    context.events[event] = context.events[event]
      || $.Callbacks('memory stopOnFalse');

    this.events[event].fireWith(context, data);

    return context;
  },
  refresh: function (options){
    var context = this;
    var viewport = context.viewport;

    // if set options
    if (arguments.length && is.type(options, 'object')) {
      context.__initOptions($.extend(context.options, options));
    }

    context.__findTarget();
    context.__changeViewport('refresh', viewport.scrollTop(), viewport.scrollLeft());

    return context;
  },
  destroy: function (){
    var context = this;
    var viewport = context.viewport;
    var namespace = '.viewport-' + context.id;

    // off event listen
    viewport.off('scroll' + namespace);
    viewport.off('resize' + namespace);
  }
};

// exports
module.exports = Viewport;
