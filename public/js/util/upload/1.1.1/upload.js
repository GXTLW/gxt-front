var $ = require('jquery');
var iframeCount = 0;

function Uploader(options) {
  if (!(this instanceof Uploader)) {
    return new Uploader(options);
  }

  if (isString(options)) {
    options = { trigger: options };
  }

  var settings = {
    trigger: null,
    name: null,
    action: null,
    data: null,
    accept: null,
    change: null,
    error: null,
    multiple: false,
    success: null,
    complete: null
  };

  if (options) {
    $.extend(settings, options);
  }

  var $trigger = $(settings.trigger).css('opacity', 0);

  settings.action = settings.action || $trigger.data('action') || '/upload';
  settings.name = settings.name || $trigger.attr('name') || $trigger.data('name') || 'file';
  settings.data = settings.data || parse($trigger.data('data'));
  settings.accept = settings.accept || $trigger.data('accept');
  settings.multiple = settings.multiple || $trigger.attr('multiple') !== undefined;
  settings.success = settings.success || $trigger.data('success');
  settings.error = settings.error || $trigger.data('error');
  settings.complete = settings.complete || $trigger.data('complete');
  this.settings = settings;

  this.setup();
  this.bind();
}

// initialize
// create input, form, iframe
Uploader.prototype.setup = function() {
  this.form = $(
    '<form method="post" enctype="multipart/form-data"'
    + 'target="" action="' + this.settings.action + '" />'
  );

  var data = this.settings.data;

  this.form.append(createInputs(data));
  this.form.append(createInputs({ '_uploader_': window.FormData ? 'formdata' : 'iframe' }));

  var input = document.createElement('input');

  input.type = 'file';
  input.name = this.settings.name;

  if (this.settings.accept) {
    input.accept = this.settings.accept;
  }

  if (this.settings.multiple) {
    input.multiple = true;
    input.setAttribute('multiple', 'multiple');
  }

  this.input = $(input);

  var $trigger = $(this.settings.trigger);
  var width = $trigger.outerWidth();
  var height = $trigger.outerHeight();

  this.input.attr('hidefocus', true).css({
    position: 'absolute',
    top: 0,
    right: 0,
    outline: 0,
    cursor: 'pointer',
    height: height,
    fontSize: Math.max(64, height * 5)
  });
  this.form.append(this.input);
  this.form.css({
    position: 'absolute',
    top: $trigger.offset().top,
    left: $trigger.offset().left,
    opacity: 0,
    overflow: 'hidden',
    width: width,
    height: height,
    zIndex: findzIndex($trigger) + 10
  }).appendTo('body');

  return this;
};

// reset position
Uploader.prototype.position = function() {
  var $trigger = $(this.settings.trigger);

  this.form.css({
    top: $trigger.offset().top,
    left: $trigger.offset().left,
    width: $trigger.outerWidth(),
    height: $trigger.outerHeight()
  });
};

// bind events
Uploader.prototype.bind = function() {
  var self = this;
  var $trigger = $(self.settings.trigger);

  $trigger.mouseenter(function() {
    self.position();
  });

  self.bindInput();
};

Uploader.prototype.bindInput = function() {
  var self = this;

  self.input.change(function(e) {
    // ie9 don't support FileList Object
    // http://stackoverflow.com/questions/12830058/ie8-input-type-file-get-files
    self._files = this.files || [
      {
        name: e.target.value
        }
      ];

    var file = self.input.val();

    if ($.isFunction(self.settings.change)) {
      self.settings.change.call(self, self._files);
    } else if (file) {
      return self.submit();
    }
  });
};

// handle submit event
// prepare for submiting form
Uploader.prototype.submit = function() {
  var self = this;

  if (window.FormData && self._files) {
    var optionXhr;
    // build a FormData
    var form = new FormData(self.form.get(0));

    // use FormData to upload
    form.append(self.settings.name, self._files);

    if (self.settings.progress) {
      // fix the progress target file
      var files = self._files;

      optionXhr = function() {
        var xhr = $.ajaxSettings.xhr();

        if (xhr.upload) {
          xhr.upload.addEventListener('progress', function(event) {
            var percent = 0;
            var position = event.loaded || event.position;
            /*event.position is deprecated*/
            var total = event.total;

            if (event.lengthComputable) {
              percent = Math.ceil(position / total * 100);
            }

            self.settings.progress(event, position, total, percent, files);
          }, false);
        }

        return xhr;
      };
    }

    $.ajax({
      url: self.settings.action,
      type: 'post',
      processData: false,
      contentType: false,
      data: form,
      xhr: optionXhr,
      context: this,
      success: self.settings.success,
      error: self.settings.error,
      complete: function() {
        self.refreshInput();

        if ($.isFunction(self.settings.complete)) {
          self.settings.complete.apply(self, arguments);
        }
      }
    });

    return this;
  } else {
    // iframe upload
    self.iframe = newIframe();
    self.form.attr('target', self.iframe.attr('name'));
    $('body').append(self.iframe);

    self.iframe.one('load', function() {
      // https://github.com/blueimp/jQuery-File-Upload/blob/9.5.6/js/jquery.iframe-transport.js#L102
      // Fix for IE endless progress bar activity bug
      // (happens on form submits to iframe targets):
      $('<iframe src="javascript:false;"></iframe>')
        .appendTo(self.form)
        .remove();

      var response = $(this).contents().find('body').html();

      $(this).remove();
      self.refreshInput();

      if (!response) {
        if ($.isFunction(self.settings.error)) {
          response = self.input.val();
          self.settings.error.call(self, response);
        }
      } else {
        if ($.isFunction(self.settings.success)) {
          self.settings.success.call(self, response);
        }
      }

      if ($.isFunction(self.settings.complete)) {
        self.settings.complete.call(self, response);
      }
    });

    self.form.submit();
  }

  return this;
};

Uploader.prototype.refreshInput = function() {
  //replace the input element, or the same file can not to be uploaded
  var newInput = this.input.clone();

  this.input.before(newInput);
  this.input.off('change');
  this.input.remove();
  this.input = newInput;
  this.bindInput();
};

// handle change event
// when value in file input changed
Uploader.prototype.change = function(callback) {
  this.settings.change = callback;

  return this;
};

// handle when upload success, error and complete
$.each(['success', 'error', 'complete'], function(i, method) {
  Uploader.prototype[method] = function(callback) {
    var me = this;

    this.settings[method] = function(response) {
      me.refreshInput();

      if ($.isFunction(callback)) {
        callback.call(me, response);
      }
    };

    return this;
  };
});

// enable
Uploader.prototype.enable = function() {
  this.input.prop('disabled', false);
  this.input.css('cursor', 'pointer');
};

// disable
Uploader.prototype.disable = function() {
  this.input.prop('disabled', true);
  this.input.css('cursor', 'not-allowed');
};

// hide
Uploader.prototype.show = function() {
  this.form.show();
};

// hide
Uploader.prototype.hide = function() {
  this.form.hide();
};

/**
 * Helpers
 */
function isString(val) {
  return Object.prototype.toString.call(val) === '[object String]';
}

function createInputs(data) {
  if (!data) return [];

  var inputs = [],
    i;

  for (var name in data) {
    i = document.createElement('input');
    i.type = 'hidden';
    i.name = name;
    i.value = data[name];
    inputs.push(i);
  }

  return inputs;
}

function parse(str) {
  if (!str) return null;

  var ret = {};
  var pairs = str.split('&');

  var unescape = function(s) {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  };

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    var key = unescape(pair[0]);

    ret[key] = unescape(pair[1]);
  }

  return ret;
}

function findzIndex($node) {
  var zIndex = 0;
  var parents = $node.parentsUntil('body');

  for (var i = 0; i < parents.length; i++) {
    var item = parents.eq(i);

    if (item.css('position') !== 'static') {
      zIndex = parseInt(item.css('zIndex'), 10) || zIndex;
    }
  }

  return zIndex;
}

function newIframe() {
  var iframeName = 'iframe-uploader-' + iframeCount;
  var iframe = $('<iframe name="' + iframeName + '" />').hide();

  iframeCount += 1;

  return iframe;
}

function MultipleUploader(options) {
  if (!(this instanceof MultipleUploader)) {
    return new MultipleUploader(options);
  }

  if (isString(options)) {
    options = { trigger: options };
  }

  var uploaders = [];
  var $trigger = $(options.trigger);

  $trigger.each(function(i, item) {
    options.trigger = item;
    uploaders.push(new Uploader(options));
  });

  this._uploaders = uploaders;
}

// add prototype
$.each(
  ['submit', 'change', 'success', 'error', 'complete', 'enable', 'disable', 'position', 'show', 'hide'],
  function(i, method) {
    MultipleUploader.prototype[method] = function() {
      $.each(this._uploaders, function(i, item) {
        item[method]();
      });

      return this;
    };
  }
);

MultipleUploader.Uploader = Uploader;

module.exports = MultipleUploader;
