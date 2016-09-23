/*!
 * selectbox
 * Date: 2015/6/12
 * https://github.com/nuintun/beauty-form
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/beauty-form/blob/master/LICENSE
 */

'use strict';

require('./css/selectbox.css');

var $ = require('jquery');
var util = require('./util');
var scrollIntoViewIfNeeded = require('./scrollintoviewifneeded');

var timer;
var reference = 0;
var actived = null;
var win = $(window);
var doc = $(document);

/**
 * compile
 * @param context
 * @param template
 * @returns {string}
 */
function compile(context, template){
  var args = [].slice.call(arguments, 2);
  var html = template.apply(context, args);

  if ($.type(html) === 'string') {
    return html;
  } else {
    throw new TypeError('Render function must return a string.');
  }
}

function SelectBox(element, options){
  var context = this;

  context.type = 'select';
  context.opened = false;
  context.destroyed = false;
  context.element = $(element);

  if (context.element.attr('multiple') !== undefined || context.element.attr('size') > 1) {
    return context;
  }

  options = $.extend({
    title: function (element, text){
      return '<i class="ui-beauty-select-align-middle"></i>'
        + '<span class="ui-beauty-select-title" title="' + text + '">'
        + text + '</span><i class="ui-beauty-select-icon"></i>';
    },
    dropdown: function (element, options){
      return '<dl class="ui-beauty-select-dropdown-items">' + options + '</dl>';
    },
    optgroup: function (element, label){
      return '<dt class="ui-beauty-select-optgroup" title="' + label + '">' + label + '</dt>';
    },
    option: function (element, option){
      return '<dd class="ui-beauty-select-option'
        + (option.group ? ' ui-beauty-select-optgroup-option' : '')
        + (option.className ? ' ' + option.className : '') + '" '
        + option.indexAttr + '="' + option.index + '" title="'
        + option.text + '">' + option.text + '</dd>';
    },
    dropdownWidth: null,
    optionIndexAttr: 'data-option',
    optionSelectedClass: 'ui-beauty-select-option-selected',
    optionDisabledClass: 'ui-beauty-select-option-disabled'
  }, options);

  $.each(['title', 'dropdown', 'optgroup', 'option'], function (index, prop){
    if ($.type(options[prop]) !== 'function') {
      throw new TypeError('Options.' + prop + ' must be a function.');
    }
  });

  context.options = options;

  context.__init();
}

/**
 * get
 * @param element
 * @returns {*}
 */
SelectBox.get = function (element){
  element = $(element);

  return element.data('beauty-select');
};

SelectBox.prototype = {
  __init: function (){
    var context = this;
    var type = context.type;
    var options = context.options;
    var namespace = '.beauty-' + type;

    actived = context;

    if (!reference) {
      var selector = 'select';

      doc.on('change' + namespace, selector, function (){
        var selectbox = SelectBox.get(this);

        if (selectbox) {
          selectbox.__renderTitlebox();
          selectbox.opened && selectbox.__refreshSelected();
        }
      });

      doc.on('focusin' + namespace + ' focusout' + namespace, selector, function (){
        var selectbox = SelectBox.get(this);

        selectbox && selectbox.__refreshSelectbox();
      });

      doc.on('mousedown' + namespace, function (e){
        var target = e.target;
        var selectbox = actived.selectbox[0];

        if (target !== selectbox && !$.contains(selectbox, target) && actived.opened) {
          actived.close();
          actived.__refreshSelectbox();
        }
      });

      doc.on('keydown' + namespace, function (e){
        if (e.which === 9 || e.which === 27) {
          actived.opened && actived.close();
          actived.__refreshSelectbox();
        }
      });

      win.on('resize' + namespace, function (){
        clearTimeout(timer);

        timer = setTimeout(function (){
          actived.opened && actived.__position();
        }, 0);
      });
    }

    context.__beauty();

    context.element.on('keypress' + namespace, function (e){
      if (e.which === 13) {
        e.preventDefault();

        if (context.opened) {
          context.close();
        } else {
          context.open();
        }
      }
    });

    context.selectbox.on('mousedown' + namespace, function (e){
      var select = context.element;

      if (select[0].disabled) return;

      e.preventDefault();

      context.focus();

      if (context.opened) {
        var target = e.target;
        var dropdown = context.dropdown[0];

        if (dropdown !== target && !$.contains(dropdown, target)) {
          context.close();
        }
      } else {
        context.open();
      }
    });

    context.selectbox.on('click' + namespace, '[' + options.optionIndexAttr + ']', function (e){
      e.preventDefault();

      var option = $(this);

      if (option.hasClass(options.optionDisabledClass)) return;

      context.select(option.attr(options.optionIndexAttr));
      context.close();
    });

    return context;
  },
  __sizeSelectbox: function (){
    var element = this.element;
    var selectbox = this.selectbox;
    var width = element.outerWidth() - selectbox.outerWidth() + selectbox.width();
    var height = element.outerHeight() - selectbox.outerHeight() + selectbox.height();

    selectbox.width(width);
    selectbox.height(height);

    return this;
  },
  __sizeDropdown: function (){
    var context = this;

    if (!context.opened) {
      context.dropdown.css('visibility', 'hidden');
      context.dropdown.appendTo(context.selectbox);
    }

    var element = context.element;
    var dropdown = context.dropdown;
    var realWidth = element.outerWidth();

    element.width('auto');

    var adaptiveWidth = element.outerWidth();

    element.outerWidth(realWidth);

    var size = {
      dropdown: {
        width: dropdown.width(),
        outerWidth: dropdown.outerWidth()
      }
    };

    var width = Math.max(
      realWidth - size.dropdown.outerWidth + size.dropdown.width,
      adaptiveWidth - size.dropdown.outerWidth + size.dropdown.width
    );

    width = Math.max(width, context.options.dropdownWidth || 0);

    dropdown.width(width);

    if (!context.opened) {
      context.dropdown.detach();
      context.dropdown.css('visibility', 'visible');
    }

    return context;
  },
  __position: function (){
    var context = this;

    if (context.opened) {
      var selectbox = context.selectbox;
      var dropdown = context.dropdown;
      var scrollTop = win.scrollTop();
      var offset = selectbox.offset();

      var size = {
        window: { height: win.height() },
        selectbox: { outerHeight: selectbox.outerHeight() },
        dropdown: { outerHeight: dropdown.outerHeight() }
      };

      var top = offset.top - scrollTop;
      var bottom = size.window.height - top - size.selectbox.outerHeight;
      var position = top > bottom ? 'top' : 'bottom';

      dropdown
        .removeClass('ui-beauty-select-dropdown-' + (position === 'top' ? 'bottom' : 'top'))
        .addClass('ui-beauty-select-dropdown-' + position);

      dropdown.css({
        top: position === 'bottom' ? size.selectbox.outerHeight : -size.dropdown.outerHeight
      });
    }

    return context;
  },
  __renderTitlebox: function (){
    var context = this;
    var element = context.element[0];
    var selected = $(element.options[element.selectedIndex]);

    context.titlebox.html(compile(
      context,
      context.options.title,
      selected,
      selected.html()
    ));

    return context;
  },
  __renderDropdown: function (){
    var index = 0;
    var dropdown = '';
    var context = this;
    var options = context.options;
    var selectedIndex = context.element[0].selectedIndex;

    function option(element, group){
      var selected = index === selectedIndex;
      var option = {
        group: group,
        index: index++,
        text: element.html(),
        indexAttr: options.optionIndexAttr,
        className: element[0].disabled
          ? options.optionDisabledClass
          : ( selected ? options.optionSelectedClass : '')
      };

      dropdown += compile(
        context,
        options.option,
        element,
        option
      );
    }

    function optgroup(element){
      dropdown += compile(
        context,
        options.optgroup,
        element,
        element.attr('label')
      );
    }

    var items = context.element.children();

    items.each(function (){
      var element = $(this);

      switch (this.nodeName.toLowerCase()) {
        case 'option':
          option(element);
          break;
        case 'optgroup':
          optgroup(element);
          element.children().each(function (){
            option($(this), element);
          });
          break;
      }
    });

    context.dropdown.html(compile(
      context,
      options.dropdown,
      items,
      dropdown
    ));

    return context;
  },
  __refreshSelectbox: function (){
    var context = this;
    var element = context.element[0];
    var selectbox = context.selectbox;
    var focused = util.activeElement();

    focused = context.opened
      || focused === element
      || focused === selectbox[0]
      || $.contains(selectbox[0], focused);

    selectbox
      .toggleClass('ui-beauty-select-disabled', element.disabled)
      .toggleClass('ui-beauty-select-focus', focused);

    return context;
  },
  __refreshSelected: function (){
    var context = this;
    var options = context.options;
    var dropdown = context.dropdown;
    var selectedClass = options.optionSelectedClass;
    var selectedIndex = context.element[0].selectedIndex;

    dropdown
      .find('.' + selectedClass)
      .removeClass(selectedClass);

    var selected = dropdown
      .find('[' + options.optionIndexAttr + '=' + selectedIndex + ']');

    selected.addClass(selectedClass);

    scrollIntoViewIfNeeded(selected[0]);

    return context;
  },
  __beauty: function (){
    var context = this;
    var element = context.element;

    if (!SelectBox.get(element)) {
      element.addClass('ui-beauty-select-hidden');

      var selectbox = $('<div tabindex="-1" class="ui-beauty-select"/>');

      context.titlebox = $('<div class="ui-beauty-select-titlebox"/>');
      context.dropdown = $('<div class="ui-beauty-select-dropdown"/>');

      selectbox
        .append(context.titlebox)
        .insertAfter(context.element);

      context.selectbox = selectbox;

      reference++;

      element.data('beauty-select', context);
    }

    return context.refresh();
  },
  focus: function (){
    this.element.trigger('focus');

    return this;
  },
  blur: function (){
    this.element.trigger('blur');

    return this;
  },
  enable: function (){
    this.element[0].disabled = false;

    return this.__refreshSelectbox();
  },
  disable: function (){
    this.element[0].disabled = true;

    return this.__refreshSelectbox();
  },
  refresh: function (){
    var context = this;

    context.__sizeSelectbox();
    context.__renderTitlebox();
    context.__renderDropdown();
    context.__sizeDropdown();

    return context.__refreshSelectbox();
  },
  select: function (index){
    this.element[0].selectedIndex = index;

    return this.__renderTitlebox();
  },
  open: function (){
    var context = this;

    if (context.opened) return context;

    context.opened = true;

    if (actived !== context) {
      actived.opened && actived.close();
      actived.__refreshSelectbox();
    }

    actived = context;

    context.selectbox.addClass('ui-beauty-select-opened');
    context.dropdown.appendTo(context.selectbox);
    context.__position();
    context.__refreshSelected();

    return context;
  },
  close: function (){
    var context = this;

    if (context.opened) {
      context.opened = false;

      context.dropdown.detach();
      context.selectbox.removeClass('ui-beauty-select-opened');
    }

    return context;
  },
  destroy: function (){
    var context = this;

    if (!context.destroyed) {
      var type = context.type;
      var element = context.element;
      var namespace = '.beauty-' + type;

      context.selectbox.off();
      context.element.off('keypress' + namespace);
      context.selectbox.remove();
      context.dropdown.remove();
      element.removeData('beauty-select');
      element.removeClass('ui-beauty-select-hidden');

      reference--;

      if (!reference) {
        doc.off('change' + namespace);
        doc.off('focusin' + namespace);
        doc.off('focusout' + namespace);
        doc.off('mousedown' + namespace);
        doc.off('keydown' + namespace);
        win.off('resize' + namespace);
      }

      context.destroyed = true;
    }
  }
};

$.fn.selectbox = function (){
  var elements = this;
  var method, options;
  var args = [].slice.call(arguments, 1);

  method = options = arguments[0];

  return elements.each(function (){
    var select = SelectBox.get(this);

    if (!select) {
      select = new SelectBox(this, options);
    }

    if ($.type(method) === 'string') {
      select[method] && select[method].apply(select, args);
    }
  });
};

module.exports = $;
