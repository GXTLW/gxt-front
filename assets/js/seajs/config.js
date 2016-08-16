/**
 * The Sea.js plugin to provide log function
 */
(function (seajs, global){
  var slice = [].slice;
  var data = seajs.data;

  // The safe wrapper for `console.xxx` functions
  // log('message') ==> console.log('message')
  // log('message', 'warn') ==> console.warn('message')
  seajs.log = function (){
    var msg;
    var type;

    // Do NOT print `log(msg)` in non-debug mode
    // Do NOT print `log(msg)` in non-support console
    if (data.debug && global.console) {
      if (arguments.length > 1) {
        type = slice.call(arguments, -1);

        if (global.console[type]) {
          msg = slice.call(arguments, 0, -1);
        } else {
          type = 'log';
          msg = slice.call(arguments, 0);
        }
      } else {
        type = 'log';
        msg = slice.call(arguments, 0);
      }

      // Call native method of console
      if (typeof global.console[type] === 'object') {
        seajs.log.apply.call(global.console[type], global.console, msg)
      } else {
        global.console[type].apply(global.console, msg);
      }
    }
  };
})(seajs, window);

/**
 * seajs config
 */
(function (seajs, window, undefined){
  // init config
  seajs.config({
    debug: GXT.DEBUG,
    base: GXT.ROOT,
    map: [
      [/\.(js|css)$/i, '.$1?version=' + GXT.VERSION]
    ]
  });
})(seajs, window);
