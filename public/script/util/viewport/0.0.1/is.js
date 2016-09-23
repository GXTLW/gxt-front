define("util/viewport/0.0.1/is", [], function(require, exports, module){
/*!
 * is
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

// object to sting
var toString = Object.prototype.toString;

// type judge
var is = {
  /**
   * type
   * @param value
   * @param type
   * @returns {boolean}
   */
  type: function (value, type){
    // format type
    type = (type + '').toLowerCase();

    // is array
    if (type === 'array' && Array.isArray) {
      return Array.isArray(value);
    }

    // get real type
    var realType = toString.call(value).toLowerCase();

    // switch
    switch (type) {
      case 'nan':
        // nan
        return realType === '[object number]' && value !== value;
      default :
        // other
        return realType === '[object ' + type + ']';
    }
  },
  /**
   * string
   * @param value
   * @returns {boolean}
   */
  string: function (value){
    return is.type(value, 'string');
  },
  /**
   * array
   * @param value
   * @returns {boolean}
   */
  array: function (value){
    return is.type(value, 'array');
  },
  /**
   * number
   * @param value
   * @returns {boolean}
   */
  number: function (value){
    return is.type(value, 'number');
  },
  /**
   * nan
   * @param value
   * @returns {boolean}
   */
  nan: function (value){
    return is.number(value) && value !== value;
  },
  /**
   * infinite
   * @param value
   * @returns {boolean}
   */
  infinite: function (value){
    return value === Infinity || value === -Infinity;
  },
  /**
   * element
   * @param value
   * @returns {boolean}
   */
  element: function (value){
    return value !== undefined
      && typeof HTMLElement !== 'undefined'
      && value instanceof HTMLElement
      && value.nodeType === 1;
  }
};

// exports
module.exports = is;

});
