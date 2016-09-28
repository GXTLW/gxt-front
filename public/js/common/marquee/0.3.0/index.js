'use strict';

var $ = require('jquery');

var cssPrefixes = ['-webkit-', '-moz-', '-o-', ''];
var eventPrefixes = ['webkit', 'moz', 'MS', 'o', ''];

function prefixedEvent(element, name, callback){
  eventPrefixes.forEach(function (prefix){
    if (!prefix) {
      name = name.toLowerCase();
    }

    element.on(prefix + name, callback);
  });
}

function SimpleMarquee(element, options){
  var context = this;

  context._element = $(element);
  context._options = $.extend({
    speed: 30,
    direction: 'left',
    cycles: 1,
    space: 40,
    delayBetweenCycles: 2000,
    handleHover: true,
    handleResize: true,
    easing: 'linear'
  }, options);

  context._resizeDelay = parseInt(context._options.handleResize, 10) || 300;
  context._horizontal = context._options.direction === 'left' || context._options.direction === 'right';
  context._animationName = 'simplemarquee-' + Math.round((Math.random() * 10000000000000)).toString(18);

  // Binds
  context._onResize = context._onResize.bind(context);
  context._onCycle = context._onCycle.bind(context);

  // Events
  context._options.handleResize && $(window).on('resize', context._onResize);
  context._options.handleHover && context._element.on({
    'mouseenter.simplemarquee': context._onMouseEnter.bind(context),
    'mouseleave.simplemarquee': context._onMouseLeave.bind(context)
  });

  // Destroy event, see: https://github.com/IndigoUnited/jquery.destroy-event
  context._element.on('destroy.simplemarquee', context.destroy.bind(context));

  // Init!
  context.update(true);
}

// ----------------------------------

SimpleMarquee.prototype.update = function (restart){
  var context = this;

  context._reset();
  context._setup();

  // If no animation is needed, reset vars
  if (!context._needsAnimation) {
    context._paused = false;
    context._cycles = 0;
    // If asked to restart, start from the begining
  } else if (restart) {
    context._paused = false;
    context._cycles = -1;
    context._onCycle();
    // Pause it if the animation was paused
  } else if (context._paused) {
    context._pause();
  }

  return context;
};

SimpleMarquee.prototype.pause = function (){
  var context = this;

  if (context._needsAnimation) {
    context._resetCycle();

    if (!context._paused) {
      context._pause();
      context._element.triggerHandler('pause');
      context._paused = true;
    }
  }

  return context;
};

SimpleMarquee.prototype.resume = function (){
  var context = this;

  if (context._needsAnimation) {
    context._resetCycle();

    if (context._paused) {
      context._resume();
      context._element.triggerHandler('resume');
      context._paused = false;
    }
  }

  return context;
};

SimpleMarquee.prototype.toggle = function (){
  var context = this;

  context._paused ? context.resume() : context.pause();

  return context;
};

SimpleMarquee.prototype.destroy = function (){
  var context = this;

  context._reset();

  // Cancel timeouts
  context._resizeTimeout && clearTimeout(context._resizeTimeout);

  // Clear listeners
  $(window).off('resize', context._onResize);
  context._element.off('.simplemarquee');

  context._element.removeData('_simplemarquee');
  context._element = null;
};

// --------------------

SimpleMarquee.prototype._reset = function (){
  var context = this;

  // Reset styles
  context._element
    .removeClass('has-enough-space')
    .css({
      'word-wrap': '',      // Deprecated in favor of overflow wrap
      'overflow-wrap': '',
      'white-space': '',
      'overflow': '',
    });

  // Remove created elements
  // Recover contents only if the contents are still there
  // This is necessary because the user might have called .html() and .simplemarquee('update')
  // In context situation, we should not restore the original contents
  if (context._wrappers) {
    context._contents.closest(context._element).length && context._element.append(context._contents);
    context._wrappers.remove();
    context._element.children('style').remove();
  }

  // Reset vars
  context._contents = context._wrappers = context._size = null;
  context._needsAnimation = false;

  // Reset cycle timer
  context._resetCycle();
};

SimpleMarquee.prototype._setup = function (){
  var wrapper;
  var context = this;

  // Set necessary wrap styles and decide if we need the marquee
  if (context._horizontal) {
    context._element.css({
      'word-wrap': 'normal',          // Deprecated in favor of overflow wrap
      'overflow-wrap': 'normal',
      'white-space': 'nowrap',
      'overflow': 'hidden',
    });

    context._needsAnimation = context._element[0].scrollWidth > Math.ceil(context._element.outerWidth());
  } else {
    context._element.css({
      'word-wrap': 'break-word',      // Deprecated in favor of overflow wrap
      'overflow-wrap': 'break-word',
      'white-space': 'normal',
      'overflow': 'hidden',
    });

    context._needsAnimation = context._element[0].scrollHeight > Math.ceil(context._element.outerHeight());
  }

  context._element.toggleClass('has-enough-space', !context._needsAnimation);

  // If marquee is not necessary, skip the code bellow
  if (!context._needsAnimation) {
    return;
  }

  // Wrap contents
  context._contents = context._element.contents();
  wrapper = $('<div class="simplemarquee-wrapper"></div>');
  wrapper.append(context._contents);
  context._element.append(wrapper);
  wrapper = $('<div class="simplemarquee-wrapper"></div>');
  wrapper.append(context._contents.clone());
  context._element.append(wrapper);
  context._wrappers = context._element.children();

  // Calculate the contents size and define the margin according
  // to the specified space option
  if (context._horizontal) {
    context._wrappers.css('display', 'inline-block');  // Use display inline block for the wrappers
    context._wrappers.eq(1).css('margin-left', context._options.space);
    context._size = context._wrappers.eq(0).outerWidth() + context._options.space;
  } else {
    context._wrappers.eq(1).css('margin-top', context._options.space);
    context._size = context._wrappers.eq(0).outerHeight() + context._options.space;
  }

  // Build the animation
  context._setupAnimation();
};

SimpleMarquee.prototype._setupAnimation = function (){
  var styleStr;
  var context = this;

  // Add the style element
  styleStr = '<style>\n';
  cssPrefixes.forEach(function (prefix){
    var context = this;

    styleStr += '@' + prefix + 'keyframes ' + context._animationName + ' {\n';

    switch (context._options.direction) {
      case 'left':
        styleStr += '    0%   { ' + prefix + 'transform: translate(0, 0); } \n';
        styleStr += '    100% { ' + prefix + 'transform: translate(-' + context._size + 'px, 0); }\n';
        break;
      case 'right':
        styleStr += '    0%   { ' + prefix + 'transform: translate(-' + context._size + 'px, 0); }\n';
        styleStr += '    100% { ' + prefix + 'transform: translate(0, 0); } \n';
        break;
      case 'top':
        styleStr += '    0%   { ' + prefix + 'transform: translate(0, 0); } \n';
        styleStr += '    100% { ' + prefix + 'transform: translate(0, -' + context._size + 'px); }\n';
        break;
      case 'bottom':
        styleStr += '    0%   { ' + prefix + 'transform: translate(0, -' + context._size + 'px); }\n';
        styleStr += '    100% { ' + prefix + 'transform: translate(0, 0); } \n';
        break;
      default:
        throw new Error('Invalid direction: ' + context._options.direction);
    }

    styleStr += '}\n';
  }, context);

  styleStr += '</style>\n';

  // Append the style and associate the animation to the wrappers
  context._element.append(styleStr);
  context._wrappers.css('animation', context._animationName + ' '
    + (context._size / context._options.speed) + 's ' + context._options.easing + ' infinite');

  // Setup animation listeners
  prefixedEvent(context._wrappers.eq(0), 'AnimationIteration', context._onCycle);
};

SimpleMarquee.prototype._pause = function (){
  this._wrappers.css('animation-play-state', 'paused');
};

SimpleMarquee.prototype._resume = function (){
  this._wrappers.css('animation-play-state', '');
};

SimpleMarquee.prototype._resetCycle = function (){
  var context = this;

  if (context._cycleTimeout) {
    clearTimeout(context._cycleTimeout);
    context._cycleTimeout = null;
  }
};

SimpleMarquee.prototype._onCycle = function (){
  var context = this;

  context._resetCycle();

  context._cycles += 1;

  // Pause if reached the end
  if (context._cycles >= context._options.cycles) {
    context.pause();
    context._element.triggerHandler('finish');
    // Otherwise pause it and schedule the resume
  } else {
    context._pause();
    context._element.triggerHandler('cycle');

    context._cycleTimeout = setTimeout(function (){
      var context = this;

      context._cycleTimeout = null;
      context._resume();
    }.bind(context), context._options.delayBetweenCycles);
  }
};

SimpleMarquee.prototype._onMouseEnter = function (){
  var context = this;

  // Restart if already finished
  if (context._paused) {
    context._cycles = 0;
    context.resume();
  } else {
    context.pause();
  }
};

SimpleMarquee.prototype._onMouseLeave = function (){
  this.resume();
};

SimpleMarquee.prototype._onResize = function (){
  var context = this;

  context._resizeTimeout && clearTimeout(context._resizeTimeout);
  context._resizeTimeout = setTimeout(function (){
    var context = this;

    context._resizeTimeout = null;
    context.update();
  }.bind(context), context._resizeDelay);
};

// -----------------------------------------------

$.fn.simplemarquee = function (options){
  var context = this;

  context.each(function (index, el){
    var instance;

    el = $(el);
    instance = el.data('_simplemarquee');

    // .simplemarquee('method')
    if (typeof options === 'string') {
      if (!instance) {
        return;
      }

      instance[options](arguments[1]);
      // .simplemarquee({})
    } else {
      if (!instance) {
        instance = new SimpleMarquee(el, options);
        el.data('_simplemarquee', instance);
      } else {
        instance.update(true);
      }
    }
  });

  return context;
};

$.fn.simplemarquee.constructor = SimpleMarquee;

module.exports = $;
