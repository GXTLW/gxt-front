/**
 * Created by Newton on 2014/11/21.
 */
var $ = require('jquery');

$.fn.delay = function(fn, delay, timer) {
  timer = 'data-' + (typeof timer === 'string' ? timer : 'delay');
  delay = typeof delay === 'number' ? delay : 200;
  fn = typeof fn === 'function' ? fn : $.noop;

  return this.each(function() {
    var target = $(this);

    clearTimeout(target.data(timer));

    target.data(timer, setTimeout(function() {
      fn.apply(target[0]);
    }, delay));
  });
};

module.exports = $;
