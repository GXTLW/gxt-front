define("common/beauty-form/0.0.1/radiobox", ["./css/radiobox.css.js","base/jquery/1.12.4/jquery","./choice"], function(require, exports, module){
/**
 * radio
 * Date: 2015/6/7
 * https://github.com/nuintun/beauty-form
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/beauty-form/blob/master/LICENSE
 */

'use strict';

require('./css/radiobox.css.js');

var $ = require('base/jquery/1.12.4/jquery');
var Choice = require('./choice');

$.fn.radiobox = function (method){
  var elements = this;
  var args = [].slice.call(arguments, 1);

  return elements.each(function (){
    var choice = Choice.get(this);

    if (!choice) {
      choice = new Choice(this);
    }

    if (method) {
      choice[method] && choice[method].apply(choice, args);
    }
  });
};

module.exports = $;

});
