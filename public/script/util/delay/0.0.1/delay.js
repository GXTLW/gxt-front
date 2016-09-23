define("util/delay/0.0.1/delay", ["base/jquery/1.12.4/jquery"], function(require, exports, module){
/**
 * Created by Newton on 2014/11/21.
 */
var $ = require('base/jquery/1.12.4/jquery');

$.fn.delay = function (fn, delay, timer){
  timer = 'data-' + (typeof timer === 'string' ? timer : 'delay');
  delay = typeof delay === 'number' ? delay : 200;
  fn = typeof fn === 'function' ? fn : $.noop;

  return this.each(function (){
    var target = $(this);

    clearTimeout(target.data(timer));

    target.data(timer, setTimeout(function (){
      fn.apply(target[0]);
    }, delay));
  });
};

module.exports = $;

});
