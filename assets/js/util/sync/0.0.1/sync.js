/**
 * Created by Newton on 2014/5/9.
 */
var $ = require('jquery');

$.fn.sync = function (lock, fn){
  fn = arguments.length === 1 ? lock : fn;
  fn = typeof fn === 'function' ? fn : $.noop;
  lock = lock && typeof lock === 'string' ? lock : 'default';
  lock = 'data-sync-' + lock;

  return this.each(function (){
    var sync = $(this);

    if (sync.data(lock)) return;

    sync.data(lock, true);

    fn.call(this, function (){
      sync.data(lock, false);
    });
  });
};

module.exports = $;
