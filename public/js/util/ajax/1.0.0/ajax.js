/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-3-19
 * Time: 下午2:44
 * To change this template use File | Settings | File Templates.
 */

'use strict';

var $ = require('jquery');
var Toast = require('toast');

var SCRIPTURLRE = /^javascript:/i;
var attrs = [
  'readyState', 'getResponseHeader', 'getAllResponseHeaders',
  'setRequestHeader', 'overrideMimeType', 'statusCode', 'abort', 'state'
];

// Is function
function isFn(fn) {
  return Object.prototype.toString.call(fn) === '[object Function]';
}

// Is string
function isStr(str) {
  return Object.prototype.toString.call(str) === '[object String]';
}

// Update state
function updateState(jqXHR, XHR) {
  jqXHR.readyState = XHR.readyState;
  jqXHR.responseText = XHR.responseText;
  jqXHR.status = XHR.status;
  jqXHR.statusText = XHR.statusText;
}

// Exports
module.exports = function(options) {
  // 默认参数
  var defaults = {
    url: '',
    data: {},
    beforeSend: $.noop,
    success: $.noop,
    error: $.noop,
    auth: function(result) {
      // 显示消息
      Toast({
        msg: result.msg
      });

      // 重定向到登录页
      top.location.href = '/Login/';
    },
    loading: '<span style="padding:0 6px 0 0;">正在'
      + (options.type && options.type.trim().toUpperCase() === 'POST' ? '传送' : '加载')
      + '数据&nbsp;&nbsp;<img src="/Assets/images/loading.gif"/></span>',
    lock: false,
    timeOut: 60000,
    cache: false
  };

  // Extend options
  options = $.extend({}, defaults, isStr(options) ? { url: options } : options);

  // Local variable
  var toast, originXHR,
    deferred = $.Deferred(),
    jqXHR = deferred.promise({
      readyState: 0
    }),
    authDeferred = $.Callbacks('once memory stopOnFalse'),
    completeDeferred = $.Callbacks('once memory stopOnFalse'),
    beforeSend = isFn(options.beforeSend) ? options.beforeSend : $.noop,
    success = isFn(options.success) ? options.success : $.noop,
    error = isFn(options.error) ? options.error : $.noop,
    complete = isFn(options.complete) ? options.complete : $.noop,
    auth = isFn(options.auth) ? options.auth : $.noop;

  // Deferred api
  jqXHR.success = jqXHR.done;
  jqXHR.auth = authDeferred.add;
  jqXHR.error = jqXHR.fail;
  jqXHR.complete = jqXHR.always = completeDeferred.add;

  // Lock dataType
  options.dataType = 'text';

  /**
   * Before send
   * @returns {*}
   */
  options.beforeSend = function(XHR) {
    // 脚本URL或者没设置链接跳出
    if (!GXT.DEBUG && (!options.url || SCRIPTURLRE.test(options.url))) return false;

    // Update state
    updateState(jqXHR, XHR);

    // Replace xhr
    arguments[0] = jqXHR;

    // Before send
    if (beforeSend.call(this) === false) return false;

    // Loading toast
    if (options.loading && isStr(options.loading)) {
      toast = Toast.loading(options.loading, {
        lock: options.lock,
        time: options.timeOut / 1000
      });
    }
  };

  /**
   * Success
   * @param data
   * @param textStatus
   * @param XHR
   */
  options.success = function(data, textStatus, XHR) {
    var result;

    // Parse JSON
    try {
      result = JSON.parse(data);
    } catch (e) {
      // JSON parse error
      options.error.call(this, XHR, 'parseerror', e);
      return;
    }

    // Result
    if (result && result.hasOwnProperty('code')) {
      // Update state
      updateState(jqXHR, XHR);

      // Replace xhr
      arguments[2] = jqXHR;

      // Replace result
      Array.prototype.splice.call(arguments, 0, 1, result);

      // Switch
      switch (result.code) {
        // Auth callback
        case 1:
          auth.apply(this, arguments);
          authDeferred.fireWith(this, arguments);
          break;
          // Success callback
        default:
          success.apply(this, arguments);
          deferred.resolveWith(this, arguments);
          break;
      }
    } else {
      // JSON pattern illegal
      options.error.call(this, XHR, 'formaterror', 'JSON pattern illegal');
    }
  };

  /**
   * Error
   * @param XHR
   * @param textStatus
   * @param errorThrown
   */
  options.error = function(XHR, textStatus, errorThrown) {
    var groupName;

    // Update state
    updateState(jqXHR, XHR);

    // Replace xhr
    arguments[0] = jqXHR;

    // Jump page
    if (XHR.readyState < 4) return;

    // Show error info in console
    groupName = 'Ajax Request : ' + options.url;

    // Logs
    seajs.log(groupName, 'group');
    seajs.log('Method:', options.type, 'warn');
    seajs.log('Status:', XHR.status, 'warn');
    seajs.log('Type:', textStatus, 'warn');
    seajs.log('Message:', errorThrown.message || errorThrown, 'warn');
    seajs.log(console && typeof console.log === 'object' ? 'XHR:' : 'XHR: %o', XHR, 'warn');
    seajs.log(groupName, 'groupEnd');

    // Show error info in toast
    Toast({
      msg: GXT.DEBUG
        ? '<span>请求状态 : </span><span style="color: #f00;">'
        + XHR.status + '</span><br/>'
        + '<span>错误类型 : </span><span style="color: #f00;">'
        + textStatus + '</span><br/>'
        + '<span>错误消息 : </span><span style="color: #f00;">'
        + (errorThrown.message || errorThrown) + '</span>'
        : '哎呀，出错了，如果一直出现错误请联系客服 T_T',
      theme: GXT.DEBUG ? 'error' : 'sad'
    });

    // Error callback
    error.apply(this, arguments);
    deferred.rejectWith(this, arguments);
  };

  /**
   * Complete
   * @param XHR
   * @param textStatus
   */
  options.complete = function(XHR, textStatus) {
    // Update state
    updateState(jqXHR, XHR);

    // Replace xhr
    arguments[0] = jqXHR;

    // Close toast
    toast && toast.hide();

    // Complete callback
    complete.apply(this, arguments);
    completeDeferred.fireWith(this, arguments);
  };

  // Start ajax
  originXHR = $.ajax(options);

  // Add attrs
  attrs.forEach(function(item) {
    if (originXHR.hasOwnProperty(item)) {
      jqXHR[item] = originXHR[item];
    }
  });

  // Return jqXHR
  return jqXHR;
};
