/**
 * Created by nuintun on 2016/9/27.
 */

'use strict';

const cwd = process.cwd();
const path = require('path');

// prototype method
const toString = Object.prototype.toString;
const getPrototypeOf = Object.getPrototypeOf;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const fnToString = hasOwnProperty.toString;
const objectFunctionString = fnToString.call(Object);

// variable declaration
const BACKSLASH_RE = /\\/g;
const DOT_RE = /\/\.\//g;
const DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;
const MULTI_SLASH_RE = /([^:/])\/+\//g;
const PROTOCOL_SLASH_RE = /(:)?\/{2,}/;
const NODE_ENV = process.env.NODE_ENV;

/**
 * is array
 * @type {Function}
 */
const isArray = Array.isArray ? Array.isArray : function(value) {
  return type(value) === 'array';
};

/**
 * type
 * @param value
 * @returns {*}
 */
function type(value) {
  // get real type
  var type = toString.call(value).toLowerCase();

  type = type.replace(/\[object (.+)]/, '$1').toLowerCase();

  // nan and infinity
  if (type === 'number') {
    // nan
    if (value !== value) {
      return 'nan';
    }

    // infinity
    if (!isFinite(value)) {
      return 'infinity';
    }
  }

  // return type
  return type;
}

/**
 * is function
 * @param value
 * @returns {boolean}
 */
function isFunction(value) {
  return type(value) === 'function';
}

/**
 * is plain object
 * @param value
 * @returns {*}
 */
function isPlainObject(value) {
  var proto, ctor;

  // detect obvious negatives
  // use toString instead of jQuery.type to catch host objects
  if (!value || type(value) !== 'object') {
    return false;
  }

  // proto
  proto = getPrototypeOf(value);

  // objects with no prototype (e.g., `Object.create( null )`) are plain
  if (!proto) {
    return true;
  }

  // objects with prototype are plain iff they were constructed by a global Object function
  ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;

  return typeof ctor === 'function' && fnToString.call(ctor) === objectFunctionString;
}

/**
 * extend
 * @returns {*}
 */
function extend() {
  var i = 1;
  var deep = false;
  var length = arguments.length;
  var target = arguments[0] || {};
  var options, name, src, copy, copyIsArray, clone;

  // handle a deep copy situation
  if (typeof target === 'boolean') {
    deep = target;
    // skip the boolean and the target
    target = arguments[i++] || {};
  }

  // handle case when target is a string or something (possible in deep copy)
  if (typeof target !== 'object' && !isFunction(target)) {
    target = {};
  }

  for (; i < length; i++) {
    // only deal with non-null/undefined values
    if ((options = arguments[i]) != null) {
      // extend the base object
      for (name in options) {
        // only copy own property
        if (!options.hasOwnProperty(name)) {
          continue;
        }

        src = target[name];
        copy = options[name];

        // prevent never-ending loop
        if (target === copy) {
          continue;
        }

        // recurse if we're merging plain objects or arrays
        if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
          if (copyIsArray) {
            copyIsArray = false;
            clone = src && isArray(src) ? src : [];
          } else {
            clone = src && isPlainObject(src) ? src : {};
          }

          // never move original objects, clone them
          target[name] = extend(deep, clone, copy);
        } else if (copy !== undefined) {
          // don't bring in undefined values
          target[name] = copy;
        }
      }
    }
  }

  // return the modified object
  return target;
}

/**
 * normalize path
 * @param path
 * @returns {string}
 */
function normalize(path) {
  // \a\b\.\c\.\d ==> /a/b/./c/./d
  path = path.replace(BACKSLASH_RE, '/');

  // :///a/b/c ==> ://a/b/c
  path = path.replace(PROTOCOL_SLASH_RE, '$1//');

  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, '/');

  // @author wh1100717
  // a//b/c ==> a/b/c
  // a///b/////c ==> a/b/c
  // DOUBLE_DOT_RE matches a/b/c//../d path correctly only if replace // with / first
  path = path.replace(MULTI_SLASH_RE, '$1/');

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, '/');
  }

  // get path
  return path;
}

// exports
module.exports = {
  cwd: cwd,
  type: type,
  extend: extend,
  fn: isFunction,
  array: isArray,
  normalize: normalize,
  object: function(value) {
    return type(value) === 'object';
  },
  string: function(value) {
    return type(value) === 'string';
  },
  realpath: function(src) {
    return path.join(cwd, src);
  },
  path2cwd: function(src) {
    var relative = normalize(path.relative(cwd, src));

    if (relative.indexOf('./') === 0 && relative.indexOf('../') === 0) {
      return relative;
    } else {
      return '/' + relative;
    }
  },
  // env
  env: {
    development: NODE_ENV === 'development'
  }
};
