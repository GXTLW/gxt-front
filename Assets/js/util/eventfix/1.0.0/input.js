/**
 * Created with WebStorm.
 * User: Administrator
 * Date: 13-8-5
 * Time: 下午12:00
 * To change this template use File | Settings | File Templates.
 */

var $ = require('jquery');
// 检查是否为可输入元素浏览器
var INPUTRE = /^INPUT|TEXTAREA$/,
  ISIE9 = /MSIE 9.0;/i.test(navigator.appVersion || ''),
  isInput = function (elem){
    return INPUTRE.test(elem.nodeName);
  };

if ('oninput' in document.createElement('input')) {
  var handler = function (event){
      event = $.event.fix(event || window.event);
      event.type = 'input';
      return $.event.dispatch.call(this, event);
    },
    bind = function (){
      if (this.addEventListener) {
        this.addEventListener('input', handler, false);
      } else if (this.attachEvent) {
        this.attachEvent('input', handler);
      }

    },
    unbind = function (){
      if (this.removeEventListener) {
        this.removeEventListener('input', handler, false);
      } else if (this.detachEvent) {
        this.detachEvent('input', handler);
      }
    };

  // 注册自定义事件
  $.event.special.input = {
    /**
     * 初始化事件
     * @returns {*}
     */
    setup: function (){
      var elem = this;
      if (!isInput(elem)) return false;
      bind.call(this);
      ISIE9 && $.event.add(elem, 'keydown.ie9-input-fix', function (event){
        event.keyCode === 8 && $.event.trigger('input', null, this);
      });
    },
    /**
     * 卸载事件
     * @returns {*}
     */
    teardown: function (){
      var elem = this;
      if (!isInput(elem)) return false;
      unbind.call(this);
      ISIE9 && $.event.remove(elem, 'keydown.ie9-input-fix');
    }
  };
} else if ('onpropertychange' in document.createElement('input')) {
  // 注册自定义事件
  $.event.special.input = {
    /**
     * 初始化事件
     * @returns {*}
     */
    setup: function (){
      var elem = this;
      if (!isInput(elem)) return false;

      $.event.add(elem, 'propertychange', function (event){
        // 元素属性任何变化都会触发propertychange事件，需要屏蔽掉非value的改变，以便接近标准的onput事件
        event.originalEvent.propertyName === 'value' && $.event.trigger('input', null, this);
      });
    },
    /**
     * 卸载事件
     * @returns {*}
     */
    teardown: function (){
      var elem = this;
      if (!isInput(elem)) return false;
      $.event.remove(elem, 'propertychange');
    }
  };
}

// 函数接口
$.fn.extend({
  input: function (fn){
    return fn ? this.on('input', fn) : this.trigger('input');
  },
  uninput: function (fn){
    return this.off('input', fn);
  }
});

// 公开接口
module.exports = $;
