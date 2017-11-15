/**
 * Created by nuintun on 2015/12/25.
 */

'use strict';

var $ = require('jquery');
var ajax = require('ajax');
var Toast = require('toast');

var SKIPATTR = 'data-skip-link';

function isSkip(element) {
  element = $(element);

  return element.attr(SKIPATTR) !== undefined;
}

function LinkSelect(root, callback) {
  this.children = [];
  this.root = root = $(root);
  this.callback = $.isFunction(callback) ? callback : function(result) {
    var context = this;

    if (result.valid) {
      context.children.forEach(function(child) {
        child.append(result.data.html);
        child.trigger('prettyform.update');
      });
    } else {
      Toast(result.msg, { theme: 'error' });
    }
  };

  root.on('change.linkselect', this._onChange.bind(this));
  root.data('LINKSELECT-INSTANCE', this);
}

LinkSelect.prototype = {
  render: function() {
    this._onChange();
  },
  add: function(select, frozen) {
    select = $(select);
    frozen = parseInt(frozen);
    frozen = isNaN(frozen) ? 0 : frozen;

    select.data('LINKSELECT-FROZEN', frozen);

    if (this.children.indexOf(select) === -1) {
      this.children.push(select)
    }

    return this;
  },
  remove: function(select) {
    select = $(select);

    this.children.filter(function(child) {
      return child !== select;
    });

    return this;
  },
  destory: function() {
    this.root.off('change.linkselect');
    this.root.removeData('LINKSELECT-FROZEN');
    this.root.removeData('LINKSELECT-INSTANCE');
  },
  _onChange: function() {
    var data = {};
    var root = this.root;
    var frozen = root.data('LINKSELECT-FROZEN');
    var option = root[0].options[root[0].selectedIndex];

    this._resetChildren();

    if (isSkip(option)) return;

    if (!frozen || root[0].selectedIndex + 1 > frozen) {
      data[root.attr('name')] = root.val();

      ajax({
        context: this,
        url: root.attr('data-url'),
        data: data
      }).done(this.callback);
    }
  },
  _resetChildren: function() {
    var context = this;

    this.children.forEach(function(child) {
      if (child[0] === context.root[0]) return;

      var frozened = null;
      var frozen = child.data('LINKSELECT-FROZEN');
      var instance = child.data('LINKSELECT-INSTANCE');

      if (frozen > 0) {
        var option;
        var options = child.children();

        for (var i = 0; i < frozen; i++) {
          option = options.eq(i).clone();

          if (i === 0) {
            frozened = option;
          } else {
            frozened.add(option);
          }
        }
      }

      child.empty();
      frozened && child.append(frozened);
      child.trigger('prettyform.update');

      if (instance) {
        instance._resetChildren();
      }
    });
  }
};

LinkSelect.isSkip = isSkip;
module.exports = LinkSelect;
