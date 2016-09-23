/**
 * Created by nuintun on 2015/1/5.
 */
'use strict';

var $ = require('jquery'),
  config = {
    trigger: '',
    range: document.body,
    filter: ':checkbox'
  };

function CheckAll(options){
  if (!(this instanceof CheckAll)) return new CheckAll(options);

  options = $.extend({}, config, options);
  this.trigger = $(options.trigger);
  this.range = $(options.range);
  this.filter = options.filter;

  this.initEvents();
}

CheckAll.prototype = {
  initialize: function (){
    this.initEvents();
  },
  initEvents: function (){
    var self = this,
      trigger = self.trigger,
      range = self.range,
      filter = self.filter;

    // 全选
    trigger.on('change', function (e, namespace){
      var state = self.state();

      // 如果是子项触发的不做处理
      if (namespace === 'checkall') return;

      // 根据选中情况处理自项
      if (trigger.prop('checked')) {
        state.checkbox.each(function (){
          var item = $(this);

          !item.prop('checked') && item.prop('checked', true).trigger('change');
        });
      } else {
        state.checkbox.each(function (){
          var item = $(this);

          item.prop('checked') && item.prop('checked', false).trigger('change');
        });
      }
    });

    // 子项
    range.on('change.checkall', ':checkbox:not(:disabled)', function (e){
      $(e.target).is(filter) && self.update();
    });
  },
  state: function (){
    var checkbox,
      self = this,
      checked = 0,
      unchecked = 0;

    // 过滤复选框
    checkbox = self.range
      .find(':checkbox:not(:disabled)')
      .filter(function (){
        var item = $(this);

        if (item[0] !== self.trigger[0] && item.is(self.filter)) {
          if (item.is(':checked')) {
            checked++;
          } else {
            unchecked++;
          }

          return true;
        }
      });

    return {
      checkbox: checkbox,
      all: checkbox.length,
      checked: checked,
      unchecked: unchecked
    }
  },
  update: function (){
    var state = this.state(),
      trigger = this.trigger;

    if (state.all > 0 && state.all === state.checked) {
      !trigger.prop('checked') && trigger.prop('checked', true).trigger('change', 'checkall');
    } else {
      trigger.prop('checked') && trigger.prop('checked', false).trigger('change', 'checkall');
    }
  },
  value: function (){
    var self = this,
      value = [];

    self.range
      .find(':checkbox:checked:not(:disabled)')
      .each(function (){
        var item = $(this);

        if (item[0] !== self.trigger[0] && item.is(self.filter)) {
          value.push(item.val());
        }
      });

    return value;
  }
};

module.exports = CheckAll;
