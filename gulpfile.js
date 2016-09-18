/**
 * Created by nuintun on 2015/7/13.
 */

'use strict';

// 开启 DEBUG 开关
process.env.DEBUG_FD = '1';
process.env.DEBUG_COLORS = 'true';
process.env.DEBUG = 'gulp-css,gulp-cmd';

// 关闭 DEBUG 开关
//process.env.DEBUG = 'false';

var path = require('path');
var join = path.join;
var relative = path.relative;
var dirname = path.dirname;
var extname = path.extname;
var resolve = path.resolve;
var gulp = require('gulp');
var rimraf = require('del');
var css = require('gulp-css');
var cmd = require('gulp-cmd');
var cdeps = require('cmd-deps');
var colors = cmd.colors;
var pedding = require('pedding');
var cssnano = require('cssnano');
var uglify = require('uglify-js');
var chokidar = require('chokidar');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var switchStream = require('switch-stream');
var bookmark = Date.now();
var runtime = [
  'assets/js/seajs/3.0.1/sea.js',
  'assets/js/seajs/config.js',
  'assets/js/base/json/1.1.2/json.js',
  'assets/js/base/es5-safe/1.0.0/es5-safe.js'
];

// compress javascript file
function compress(){
  return switchStream(function (vinyl){
    if (extname(vinyl.path) === '.js') {
      return 'js';
    }

    if (extname(vinyl.path) === '.css') {
      return 'css';
    }
  }, {
    js: switchStream.through(function (vinyl, encoding, next){
      try {
        var result = uglify.minify(vinyl.contents.toString(), { fromString: true });
        vinyl.contents = new Buffer(result.code);
      } catch (error) {
        // no nothing
      }

      this.push(vinyl);
      next();
    }),
    css: switchStream.through(function (vinyl, encoding, next){
      var context = this;

      cssnano.process(vinyl.contents.toString(), {
        safe: true,
        autoprefixer: {
          browsers: ['> 1% in CN', '> 5%', 'ie >= 8'],
          cascade: false,
          remove: false
        }
      }).then(function (result){
        vinyl.contents = new Buffer(result.css);

        context.push(vinyl);
        next();
      });
    })
  });
}

// rewrite cmd plugins
var CMDPLUGINS = {
  css: function (vinyl, options, next){
    var context = this;

    cssnano.process(vinyl.contents.toString(), {
      safe: true,
      autoprefixer: {
        browsers: ['> 1% in CN', '> 5%', 'ie >= 8'],
        cascade: false,
        remove: false
      }
    }).then(function (result){
      vinyl.contents = new Buffer(result.css);

      cmd.defaults.plugins.css.exec(vinyl, options, function (vinyl){
        try {
          var result = uglify.minify(vinyl.contents.toString(), { fromString: true });
          vinyl.contents = new Buffer(result.code);
        } catch (error) {
          // no nothing
        }

        context.push(vinyl);
        next();
      });
    });
  }
};

['js', 'json', 'tpl', 'html'].forEach(function (name){
  CMDPLUGINS[name] = function (vinyl, options, next){
    var context = this;
    // transform
    cmd.defaults.plugins[name].exec(vinyl, options, function (vinyl){
      try {
        var result = uglify.minify(vinyl.contents.toString(), { fromString: true });
        vinyl.contents = new Buffer(result.code);
      } catch (error) {
        // no nothing
      }

      context.push(vinyl);
      next();
    });
  }
});

// rewrite css plugins
var CSSPLUGINS = {
  css: function (vinyl, options, next){
    var context = this;

    cssnano.process(vinyl.contents.toString(), {
      safe: true,
      autoprefixer: {
        browsers: ['> 1% in CN', '> 5%', 'ie >= 8'],
        cascade: false,
        remove: false
      }
    }).then(function (result){
      vinyl.contents = new Buffer(result.css);

      css.defaults.plugins.css.exec(vinyl, options, function (vinyl){
        context.push(vinyl);
        next();
      });
    });
  }
};

// file watch
function watch(glob, options, callabck){
  if (typeof options === 'function') {
    callabck = options;
    options = {};
  }

  // ignore initial add event
  options.ignoreInitial = true;
  // ignore permission errors
  options.ignorePermissionErrors = true;

  // get watcher
  var watcher = chokidar.watch(glob, options);

  // bing event
  if (callabck) {
    watcher.on('all', function (event, path){
      if (path && path.lastIndexOf('___jb_tmp___') !== path.length - 12) {
        callabck.apply(this, arguments);
      }
    });
  }

  // return watcher
  return watcher;
}

function getAlias(){
  delete require.cache[require.resolve('./alias.json')];

  return require('./alias.json');
}

// css resource path
function onpath(path, property, file, wwwroot){
  if (/^[^./\\]/.test(path)) {
    path = './' + path;
  }

  if (path.indexOf('.') === 0) {
    path = join(dirname(file), path);
    path = relative(wwwroot, path);
    path = '/' + path;
    path = path.replace(/\\+/g, '/');
  }

  path = path.replace('/Assets/css/', '/Assets/style/');
  path = path.replace('/Assets/js/', '/Assets/script/');

  return path;
}

// date format
function dateFormat(date, format){
  // 参数错误
  if (!date instanceof Date) {
    throw new TypeError('Param date must be a Date');
  }

  format = format || 'yyyy-MM-dd hh:mm:ss';

  var map = {
    'M': date.getMonth() + 1, //月份
    'd': date.getDate(), //日
    'h': date.getHours(), //小时
    'm': date.getMinutes(), //分
    's': date.getSeconds(), //秒
    'q': Math.floor((date.getMonth() + 3) / 3), //季度
    'S': date.getMilliseconds() //毫秒
  };

  format = format.replace(/([yMdhmsqS])+/g, function (all, t){
    var v = map[t];

    if (v !== undefined) {
      if (all.length > 1) {
        v = '0' + v;
        v = v.substr(v.length - 2);
      }

      return v;
    } else if (t === 'y') {
      return (date.getFullYear() + '').substr(4 - all.length);
    }

    return all;
  });

  return format;
}

// clean task
gulp.task('clean', function (){
  bookmark = Date.now();

  rimraf.sync(['assets/style', 'assets/script']);
});

// runtime task
gulp.task('runtime', ['clean'], function (){
  // loader file
  gulp.src(runtime, { base: 'assets/js', nodir: true })
    .pipe(plumber())
    .pipe(concat('seajs/3.0.1/sea.js'))
    .pipe(gulp.dest('assets/script'));
});

// runtime task
gulp.task('runtime-product', ['clean'], function (){
  // loader file
  gulp.src(runtime, { base: 'assets/js', nodir: true })
    .pipe(plumber())
    .pipe(concat('seajs/3.0.1/sea.js'))
    .pipe(compress())
    .pipe(gulp.dest('assets/script'));
});

// develop task
gulp.task('default', ['runtime'], function (){
  // complete callback
  var complete = pedding(3, function (){
    var now = new Date();

    console.log(
      '  %s [%s] build complete... √ %s\x07',
      colors.green.bold('gulp-default'),
      dateFormat(now),
      colors.green('+' + (now - bookmark) + 'ms')
    );
  });

  // cmd js file
  gulp.src([
    'assets/js/**/*',
    '!assets/js/seajs/**/*',
    '!assets/js/base/json/**/*',
    '!assets/js/base/es5-safe/**/*',
    '!assets/js/base/html5shiv/**/*',
    '!assets/js/util/kindeditor/*/*/**/*'
  ], { base: 'assets/js', nodir: true })
    .pipe(plumber())
    .pipe(cmd({
      alias: getAlias(),
      include: 'self',
      css: { onpath: onpath }
    }))
    .pipe(gulp.dest('assets/script'))
    .on('finish', complete);

  // kindeditor file
  gulp.src([
    'assets/js/base/html5shiv/**/*',
    'assets/js/util/kindeditor/*/*/**/*'
  ], { base: 'assets/js', nodir: true })
    .pipe(plumber())
    .pipe(gulp.dest('assets/script'))
    .on('finish', complete);

  // css file
  gulp.src('assets/css/**/*', { base: 'assets/css', nodir: true })
    .pipe(plumber())
    .pipe(css({ onpath: onpath }))
    .pipe(gulp.dest('assets/style'))
    .on('finish', complete);
});

// develop watch task
gulp.task('watch', ['default'], function (){
  var base = join(process.cwd(), 'assets');

  // debug watcher
  function debugWatcher(event, path){
    var now = new Date();

    console.log(
      '  %s %s: %s %s',
      colors.green.bold('gulp-watch'),
      event,
      colors.magenta(join('assets', path).replace(/\\/g, '/')),
      colors.green('+' + (now - bookmark) + 'ms')
    );
  }

  // complete callback
  function complete(){
    var now = new Date();

    console.log(
      '  %s [%s] build complete... √ %s',
      colors.green.bold('gulp-watch'),
      dateFormat(now),
      colors.green('+' + (now - bookmark) + 'ms')
    );
  }

  // watch js file
  watch([
    'assets/js',
    '!assets/js/seajs',
    '!assets/js/base/json',
    '!assets/js/base/es5-safe',
    '!assets/js/base/html5shiv',
    'assets/js/util/kindeditor/*/kindeditor.js'
  ], function (event, path){
    var rpath = relative(join(base, 'js'), path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, join('js', rpath));

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('assets/script', rpath));
      complete();
    } else {
      gulp.src(path, { base: 'assets/js' })
        .pipe(plumber())
        .pipe(cmd({
          alias: getAlias(),
          include: 'self',
          cache: false,
          css: { onpath: onpath }
        }))
        .pipe(gulp.dest('assets/script'))
        .on('finish', complete);
    }
  });

  // kindeditor file
  watch([
    'assets/js/base/html5shiv',
    'assets/js/util/kindeditor',
    '!assets/js/util/kindeditor/*/kindeditor.js'
  ], function (event, path){
    var rpath = relative(join(base, 'js'), path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, join('js', rpath));

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('assets/script', rpath));
      complete();
    } else {
      gulp.src(path, { base: 'assets/js' })
        .pipe(plumber())
        .pipe(gulp.dest('assets/script'))
        .on('finish', complete);
    }
  });

  // watch css file
  watch('assets/css', function (event, path){
    var rpath = relative(join(base, 'css'), path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, join('css', rpath));

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('assets/style', rpath));
      complete();
    } else {
      gulp.src(path, { base: 'assets/css' })
        .pipe(plumber())
        .pipe(css({
          onpath: function (path){
            return path.replace('assets/css/', 'assets/style/')
          }
        }))
        .pipe(gulp.dest('assets/style'))
        .on('finish', complete);
    }
  });
});

// product task
gulp.task('product', ['runtime-product'], function (){
  var ignore = ['jquery'];
  // complete callback
  var complete = pedding(3, function (){
    var now = new Date();

    console.log(
      '  %s [%s] build complete... √ %s\x07',
      colors.green.bold('gulp-product'),
      dateFormat(now),
      colors.green('+' + (now - bookmark) + 'ms')
    );
  });

  gulp.src('assets/js/views/common.js', { base: 'assets/js', nodir: true })
    .pipe(plumber())
    .pipe(cmd({
      cache: false,
      alias: getAlias(),
      ignore: ignore,
      plugins: {
        css: CMDPLUGINS.css,
        html: CMDPLUGINS.html,
        json: CMDPLUGINS.json,
        tpl: CMDPLUGINS.tpl
      },
      include: 'all',
      css: {
        onpath: onpath
      }
    }))
    .pipe(switchStream.through(function (vinyl, encoding, next){
      cdeps(vinyl.contents.toString()).forEach(function (item){
        ignore.push(item.path);
      });

      this.push(vinyl);
      next();
    }))
    .pipe(compress())
    .pipe(gulp.dest('assets/script'))
    .on('finish', function (){
      // cmd js file
      gulp.src([
        'assets/js/**/*',
        '!assets/js/seajs/**/*',
        '!assets/js/views/common.js',
        '!assets/js/base/json/**/*',
        '!assets/js/base/es5-safe/**/*',
        '!assets/js/base/html5shiv/**/*',
        '!assets/js/util/kindeditor/*/*/**/*'
      ], { base: 'assets/js', nodir: true })
        .pipe(plumber())
        .pipe(cmd({
          alias: getAlias(),
          ignore: ignore,
          plugins: CMDPLUGINS,
          include: function (id){
            return id && id.indexOf('views') === 0 ? 'all' : 'self';
          },
          css: {
            onpath: onpath
          }
        }))
        .pipe(gulp.dest('assets/script'))
        .on('finish', complete);
    });

  // kindeditor file
  gulp.src([
    'assets/js/base/html5shiv/**/*',
    'assets/js/util/kindeditor/*/*/**/*'
  ], { base: 'assets/js', nodir: true })
    .pipe(plumber())
    .pipe(compress())
    .pipe(gulp.dest('assets/script'))
    .on('finish', complete);

  // css file
  gulp.src('assets/css/?(default|fonts)/**/*', { base: 'assets/css', nodir: true })
    .pipe(plumber())
    .pipe(css({
      include: true,
      onpath: onpath,
      plugins: CSSPLUGINS
    }))
    .pipe(gulp.dest('assets/style'))
    .on('finish', complete);
});
