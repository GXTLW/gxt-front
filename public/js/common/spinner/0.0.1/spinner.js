/**
 * Created by nuintun on 2016/3/23.
 */

'use strict';

var $ = require('inputfix');

function Spinner(value, options) {
  var __EMITTERS__ = {};

  this.__EventEmitter__ = function(event) {
    var callbacks;
    var emitter = __EMITTERS__[event];

    if (!emitter) {
      callbacks = $.Callbacks();

      emitter = {
        on: callbacks.add,
        off: callbacks.remove,
        emit: callbacks.fire
      };

      if (event) {
        __EMITTERS__[event] = emitter;
      }
    }

    return emitter;
  };

  options = $.extend({
    step: 1,
    range: [null, null]
  }, options);

  this.options = options;

  this.step(options.step);
  this.range(options.range);
  this.val(value || options.range[0] || 0);
}

Spinner.INCREMENT = 1;
Spinner.DECREMENT = -1;

Spinner.prototype = {
  on: function(event, callback) {
    this.__EventEmitter__(event).on(callback);

    return this;
  },
  off: function(event, callback) {
    this.__EventEmitter__(event).off(callback);

    return this;
  },
  emit: function(event) {
    this.__EventEmitter__(event).emit.apply(this, [].slice.call(arguments, 1));

    return this;
  },
  val: function(value) {
    if ($.isNumeric(value)) {
      value = +value;

      var options = this.options;
      var min = options.range[0];
      var max = options.range[1];

      if (min !== null && value < min) {
        value = min;

        this.emit('min', value);
      } else if (max !== null && value > max) {
        value = max;

        this.emit('max', value);
      }

      var origin = this.value;

      if (origin !== value) {
        this.value = value;

        this.emit('spin', value, origin);
      }
    }

    return this;
  },
  step: function(step) {
    this.options.step = Math.abs($.isNumeric(step) ? step : 1);

    return this;
  },
  range: function(range) {
    range = Array.isArray(range) ? range : [];

    var min = range[0];
    var max = range[1];
    var minIsNum = $.isNumeric(min);
    var maxIsNum = $.isNumeric(max);

    if (minIsNum && maxIsNum) {
      range = [Math.min(min, max), Math.max(min, max)];
    } else if (minIsNum && !maxIsNum) {
      range = [min, null];
    } else if (!minIsNum && maxIsNum) {
      range = [null, maxIsNum];
    } else {
      range = [null, null];
    }

    this.options.range = range;

    this.val(this.value);

    return this;
  },
  spin: function(direction) {
    if (direction === Spinner.INCREMENT || direction === Spinner.DECREMENT) {
      var value = this.value;
      var options = this.options;

      this.val(value + direction * options.step);
    }

    return this;
  }
};

$.fn.spinner = function() {
  var args = arguments;
  var options = args.length >= 2 ? args[0] : $.extend({}, args[0]);

  return this.each(function() {
    var input = $(this);

    var spinner = input.data('data-spinner');

    if (options && args.length >= 2 && spinner) {
      var value = args[1];

      switch (options) {
        case 'max':
          spinner.range([spinner.options.range[0], value]);
          break;
        case 'min':
          spinner.range([value, spinner.options.range[1]]);
        case 'step':
          spinner.step(value);
          break;
        case 'value':
          spinner.val(value);
          break;
      }

      return;
    }

    if (!spinner) {
      var step = options.step || 1;
      var min = isNaN(options.min) ? null : options.min;
      var max = isNaN(options.max) ? null : options.max;

      var decrement = $.isFunction(options.decrement)
        ? options.decrement.call(this)
        : options.decrement;
      var increment = $.isFunction(options.increment)
        ? options.increment.call(this)
        : options.increment;

      var syncInput = function(value, origin) {
        if (value !== +input.val()) {
          input.val(value);
          input.trigger('spin', [value, origin]);
        }
      };

      spinner = new Spinner(this.value, {
        step: step,
        range: [min, max]
      });

      spinner.on('spin', syncInput);

      spinner.on('min', syncInput);

      spinner.on('max', syncInput);

      input.on('keypress', function(e) {
        var keyCode = e.keyCode;

        //codes for 0-9
        if (keyCode < 48 || keyCode > 57) {
          //codes for backspace, delete, enter
          if (keyCode !== 0 && keyCode !== 8 && keyCode !== 13 && keyCode !== 45 && !e.ctrlKey) {
            e.preventDefault();
          }
        }
      });

      input.on('keydown', function(e) {
        var keyCode = e.keyCode;

        if (keyCode === 38) {
          spinner.spin(Spinner.INCREMENT);
        } else if (keyCode === 40) {
          spinner.spin(Spinner.DECREMENT);
        }
      });

      input.on('input', function() {
        if (!this.value.length) {
          spinner.val(spinner.options.range[0] || 0);

          return;
        }

        var val = Math.abs(parseInt(this.value));

        if (isNaN(val)) {
          input.val(spinner.value);
        } else {
          if (val.toString().length !== this.value.length) {
            input.val(val);
          }

          if (spinner.value !== val) {
            var origin = spinner.value;

            spinner.val(val);
            input.trigger('spin', [val, origin]);
          }
        }
      });

      decrement = $(decrement);
      increment = $(increment);

      increment.on('click', function(e) {
        e.preventDefault();

        spinner.spin(Spinner.INCREMENT);
      });

      decrement.on('click', function(e) {
        e.preventDefault();

        spinner.spin(Spinner.DECREMENT);
      });

      input.data('data-spinner', spinner);
    }
  });
};

module.exports = $;
