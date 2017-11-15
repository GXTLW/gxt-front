/*!
 * choice
 * Date: 2015/6/7
 * https://github.com/nuintun/beauty-form
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/beauty-form/blob/master/LICENSE
 */

'use strict';

require('./css/choice.css');

var $ = require('jquery');
var util = require('./util');

var reference = {};
var doc = $(document);

/**
 * radio
 * @param element
 */
function radio(element) {
  doc.find('input[type=radio][name=' + element.name + ']').each(function() {
    var choice = Choice.get(this);

    if (choice && element !== this) {
      choice.refresh();
    }
  });
}

/**
 * Choice
 * @param element
 * @constructor
 */
function Choice(element) {
  var context = this;

  context.destroyed = false;
  context.element = $(element);
  context.type = context.element.attr('type');
  context.type = context.type ? context.type.toLowerCase() : undefined;

  var choice = Choice.get(element);

  if (choice) {
    return choice;
  }

  if (context.type !== 'checkbox' && context.type !== 'radio') {
    throw new TypeError('The element must be a checkbox or radio.');
  }

  context.__init();
}

/**
 * get
 * @param element
 * @returns {*}
 */
Choice.get = function(element) {
  element = $(element);

  return element.data('beauty-choice');
};

/**
 * Choice.prototype
 * @type {{
 *   init: Choice.init,
 *   focus: Choice.focus,
 *   blur: Choice.blur,
 *   check: Choice.check,
 *   uncheck: Choice.uncheck,
 *   enable: Choice.enable,
 *   disable: Choice.disable,
 *   refresh: Choice.refresh,
 *   beauty: Choice.beauty,
 *   destory: Choice.destory
 * }}
 */
Choice.prototype = {
  __init: function() {
    var type = this.type;

    if (!reference[type]) {
      reference[type] = 0;

      var namespace = '.beauty-' + type;
      var selector = 'input[type=' + type + ']';

      doc.on('change' + namespace, selector, function() {
        var choice = Choice.get(this);

        if (choice) {
          if (type === 'radio') {
            radio(this);
          }

          choice.refresh();
        }
      });

      doc.on('focusin' + namespace, selector, function() {
        var choice = Choice.get(this);

        choice && choice.refresh();
      });

      doc.on('focusout' + namespace, selector, function() {
        var choice = Choice.get(this);

        choice && choice.refresh();
      });
    }

    return this.__beauty();
  },
  __beauty: function() {
    var context = this;
    var element = context.element;

    if (!Choice.get(element)) {
      var type = context.type;

      element.wrap('<i tabindex="-1" class="ui-beauty-choice ui-beauty-' + type + '"/>');

      reference[type]++;
      context.choice = element.parent();

      element.data('beauty-choice', context);
    }

    return context.refresh();
  },
  focus: function() {
    this.element.trigger('focus');

    return this;
  },
  blur: function() {
    this.element.trigger('blur');

    return this;
  },
  check: function() {
    var type = this.type;
    var element = this.element[0];

    element.checked = true;

    if (type === 'radio') {
      radio(element);
    }

    return this.refresh();
  },
  uncheck: function() {
    var type = this.type;
    var element = this.element[0];

    element.checked = false;

    if (type === 'radio') {
      radio(element);
    }

    return this.refresh();
  },
  enable: function() {
    this.element[0].disabled = false;

    return this.refresh();
  },
  disable: function() {
    this.element[0].disabled = true;

    return this.refresh();
  },
  refresh: function() {
    var element = this.element[0];

    this.choice
      .toggleClass('ui-beauty-choice-checked', element.checked)
      .toggleClass('ui-beauty-choice-disabled', element.disabled)
      .toggleClass('ui-beauty-choice-focus', util.activeElement() === element);

    return this;
  },
  destroy: function() {
    var context = this;

    if (context.destroyed) return;

    var type = context.type;
    var element = context.element;

    element.unwrap();
    element.removeData('beauty-choice');

    reference[type]--;

    if (!reference[type]) {
      var namespace = '.beauty-' + type;

      doc.off('change' + namespace);
      doc.off('focusin' + namespace);
      doc.off('focusout' + namespace);
    }

    context.destroyed = true;
  }
};

// 公开接口
module.exports = Choice;
