/**
 * Created by nuintun on 2015/10/29.
 */

'use strict';

// nameStorage
//
// 利用 window.name 实现跨页面跨域的数据传输。

var Q = '?';
var EQ = '=';
var AND = '&';
var data = {};
var ORIGIN_NAME;
var STORAGE = {};
var nameStorage = {};
var SCHEME = 'name-storage:';
var encode = encodeURIComponent;
var decode = decodeURIComponent;
var RE_PAIR = /^([^=]+)(?:=(.*))?$/;

// 解析并初始化 name 数据。
// 标准的 nameStorage 数据格式为 `name-storage:origin-name?key=value`
// @param {String} name.
(function parse(name) {
  if (name && name.indexOf(SCHEME) === 0) {
    var match = name.split(/[:?]/);

    match.shift(); // scheme: match[0];
    ORIGIN_NAME = decode(match.shift()) || ''; // match[1]

    var params = match.join(''); // match[2,...]
    var pairs = params.split(AND);

    for (var i = 0, pair, key, value, l = pairs.length; i < l; i++) {
      pair = pairs[i].match(RE_PAIR);

      if (!pair || !pair[1]) { continue; }

      key = decode(pair[1]);
      value = decode(pair[2]) || '';
      STORAGE[key] = value;
    }
  } else {
    ORIGIN_NAME = name || '';
  }
})(window.name);

// 写入数据。
// @param {String} key, 键名。
// @param {String} value, 键值。
nameStorage.setItem = function(key, value) {
  if (!key || value === undefined) {
    return;
  }

  STORAGE[key] = String(value);

  save();
};

// 读取数据。
// @param {String} key, 键名。
// @return {String} 键值。如果不存在，则返回 `null`。
nameStorage.getItem = function(key) {
  return STORAGE.hasOwnProperty(key) ? STORAGE[key] : null;
};

// 移除数据。
// @param {String} key, 键名。
nameStorage.removeItem = function(key) {
  if (!STORAGE.hasOwnProperty(key)) {
    return;
  }

  STORAGE[key] = null;

  delete STORAGE[key];

  save();
};

// 清空 nameStorage。
nameStorage.clear = function() {
  STORAGE = {};

  save();
};

nameStorage.valueOf = function() {
  return STORAGE;
};

nameStorage.toString = function() {
  var name = window.name;

  return name.indexOf(SCHEME) === 0 ? name : SCHEME + name;
};

// 保存数据到 window.name
// 如果没有存储数据，则恢复原始窗口名称(window.name)。
function save() {
  var value;
  var pairs = [];
  var empty = true;

  for (var key in STORAGE) {
    if (STORAGE.hasOwnProperty(key)) {
      empty = false;
      value = STORAGE[key] || '';

      pairs.push(encode(key) + EQ + encode(value));
    }
  }

  window.name = empty ? ORIGIN_NAME : SCHEME + encode(ORIGIN_NAME) + Q + pairs.join(AND);
}

// add event listener implementation
// @param {HTMLElement} element.
// @param {String} eventName.
// @param {Function} handler.
function addEventListener(element, eventName, handler) {
  if (!element) { return; }

  if (element.addEventListener) {
    element.addEventListener(eventName, handler, false);
  } else if (element.attachEvent) {
    element.attachEvent('on' + eventName, function(evt) {
      handler.call(element, evt);
    });
  }
}

// save the last data for the next page.
addEventListener(window, 'beforeunload', save);

// exports
module.exports = nameStorage;
