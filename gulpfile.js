/**
 * Created by nuintun on 2015/7/13.
 */

'use strict';

const util = require('util');
const path = require('path');
const join = path.join;
const relative = path.relative;
const dirname = path.dirname;
const extname = path.extname;
const resolve = path.resolve;
const gulp = require('gulp');
const rimraf = require('del');
const css = require('@nuintun/gulp-css');
const cmd = require('@nuintun/gulp-cmd');
const cdeps = require('cmd-deps');
const chalk = cmd.chalk;
const holding = require('holding');
const cssnano = require('cssnano');
const uglify = require('uglify-es');
const chokidar = require('chokidar');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const cmdAddons = require('@nuintun/gulp-cmd-plugins');
const cssAddons = require('@nuintun/gulp-css-plugins');
const switchStream = require('@nuintun/switch-stream');

let bookmark = Date.now();
const runtime = [
  'public/js/seajs/3.0.1/sea.js',
  'public/js/seajs/config.js',
  'public/js/base/json/1.1.2/json.js',
  'public/js/base/es5-safe/1.0.0/es5-safe.js'
];

/**
 * @function progress
 * @description Show progress logger
 * @param {Function} print
 */
function progress(print) {
  return switchStream.through(function(vinyl, encoding, next) {
    const info = chalk.reset.reset('process: ')
      + chalk.reset.green(join(vinyl.base, vinyl.relative).replace(/\\/g, '/'));

    if (print) {
      print(info);
    } else {
      process.stdout.write(chalk.reset.bold.cyan('  gulp-odd ') + info + '\n');
    }

    next(null, vinyl);
  });
}

/**
 * @function finish
 * @description Build finish function
 */
function finish() {
  const now = new Date();

  console.log(
    '  %s [%s] build complete... %s',
    chalk.reset.green.bold.inverse(' √ DONE '),
    dateFormat(now),
    chalk.reset.green('+' + (now - bookmark) + 'ms')
  );
}

/**
 * @function inspectError
 * @param {Error} error
 * @returns {string}
 */
function inspectError(error) {
  return util
    .inspect(error)
    .replace(/^\{\s*|\}\s*$/g, '');
}

/**
 * @function compress
 * @description Compress javascript file
 */
function compress() {
  return switchStream((vinyl) => {
    if (extname(vinyl.path) === '.js') {
      return 'js';
    }

    if (extname(vinyl.path) === '.css') {
      return 'css';
    }
  }, {
    js: switchStream.through(function(vinyl, encoding, next) {
      const result = uglify.minify(vinyl.contents.toString(), {
        ecma: 5,
        ie8: true,
        mangle: { eval: true }
      });

      if (result.error) {
        process.stdout.write(chalk.reset.bold.cyan('  gulp-odd ') + inspectError(result.error) + '\n');
      } else {
        vinyl.contents = new Buffer(result.code);
      }

      this.push(vinyl);
      next();
    }),
    css: switchStream.through(function(vinyl, encoding, next) {
      cssnano
        .process(vinyl.contents.toString(), { safe: true })
        .then((result) => {
          vinyl.contents = new Buffer(result.css);

          context.push(vinyl);
          next();
        })
        .catch((error) => {
          process.stdout.write(chalk.reset.bold.cyan('  gulp-odd ') + inspectError(result.error) + '\n');
          next();
        });
    })
  });
}

/**
 * @function watch
 * @description Files watch
 * @param {string|Array<string>} glob
 * @param {Object} options
 * @param {Function} callabck
 */
function watch(glob, options, callabck) {
  if (typeof options === 'function') {
    callabck = options;
    options = {};
  }

  // Ignore initial add event
  options.ignoreInitial = true;
  // Ignore permission errors
  options.ignorePermissionErrors = true;

  // Get watcher
  const watcher = chokidar.watch(glob, options);

  // Bind event
  if (callabck) {
    watcher.on('all', callabck);
  }

  // Return watcher
  return watcher;
}

/**
 * @function getAlias
 */
function getAlias() {
  delete require.cache[require.resolve('./alias.json')];

  return require('./alias.json');
}

/**
 * @function resolveCSSPath
 * @description Resolve css path
 * @param {string} path
 * @param {string} file
 * @param {string} wwwroot
 * @returns {string}
 */
function resolveCSSPath(path, file, wwwroot) {
  if (/^[^./\\]/.test(path)) {
    path = './' + path;
  }

  if (path.charAt(0) === '.') {
    path = join(dirname(file), path);
    path = relative(wwwroot, path);
    path = '/' + path;
    path = path.replace(/\\+/g, '/');
  }

  return path
    .replace('/public/css/', '/public/style/')
    .replace('/public/js/', '/public/script/');
}

/**
 * @function resolveMapPath
 * @description Resolve js path
 * @param {string} path
 * @returns {string}
 */
function resolveMapPath(path) {
  return path
    .replace('/public/css/', '/public/style/')
    .replace('/public/js/', '/public/script/');
}

/**
 * @function dateFormat
 * @param {Date} date
 * @param {String} format
 * @returns {String}
 */
function dateFormat(date, format) {
  // 参数错误
  if (!date instanceof Date) {
    throw new TypeError('Param date must be a Date');
  }

  format = format || 'yyyy-MM-dd hh:mm:ss';

  const map = {
    'M': date.getMonth() + 1, //月份
    'd': date.getDate(), //日
    'h': date.getHours(), //小时
    'm': date.getMinutes(), //分
    's': date.getSeconds(), //秒
    'q': Math.floor((date.getMonth() + 3) / 3), //季度
    'S': date.getMilliseconds() //毫秒
  };

  format = format.replace(/([yMdhmsqS])+/g, (all, t) => {
    let v = map[t];

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

// Clean task
gulp.task('clean', () => {
  bookmark = Date.now();

  rimraf.sync(['public/style', 'public/script']);
});

// Runtime task
gulp.task('runtime', ['clean'], () => {
  // Loader file
  gulp
    .src(runtime, { base: 'public/js', nodir: true })
    .pipe(plumber())
    .pipe(progress())
    .pipe(concat('seajs/3.0.1/sea.js'))
    .pipe(gulp.dest('public/script'));
});

// Runtime task
gulp.task('runtime-product', ['clean'], () => {
  // Loader file
  gulp
    .src(runtime, { base: 'public/js', nodir: true })
    .pipe(plumber())
    .pipe(progress())
    .pipe(concat('seajs/3.0.1/sea.js'))
    .pipe(compress())
    .pipe(gulp.dest('public/script'));
});

// Develop task
gulp.task('default', ['runtime'], () => {
  // complete callback
  const complete = holding(2, () => {
    finish();
    process.stdout.write('\x07');
  });

  // Normal file
  gulp
    .src([
      'public/js/base/html5shiv/**/*'
    ], { base: 'public/js', nodir: true })
    .pipe(plumber())
    .pipe(progress())
    .pipe(gulp.dest('public/script'))
    .on('finish', complete);

  // CMD js file
  gulp
    .src([
      'public/js/**/*',
      '!public/js/seajs/**/*',
      '!public/js/base/json/**/*',
      '!public/js/base/es5-safe/**/*',
      '!public/js/base/html5shiv/**/*'
    ], { base: 'public/js', nodir: true })
    .pipe(plumber())
    .pipe(progress(cmd.print))
    .pipe(cmd({
      include: 'self',
      alias: getAlias(),
      base: 'public/js',
      plugins: cmdAddons(),
      map: resolveMapPath,
      css: { onpath: resolveCSSPath }
    }))
    .pipe(gulp.dest('public/script'))
    .on('finish', complete);

  // CSS file
  gulp
    .src('public/css/**/*', { base: 'public/css', nodir: true })
    .pipe(plumber())
    .pipe(progress(css.print))
    .pipe(css({
      map: resolveMapPath,
      onpath: resolveCSSPath,
      plugins: cssAddons()
    }))
    .pipe(gulp.dest('public/style'))
    .on('finish', complete);
});

// Develop watch task
gulp.task('watch', ['default'], () => {
  const base = join(process.cwd(), 'Assets');

  /**
   * @function debugWatcher
   * @param {string} event
   * @param {string} path
   */
  function debugWatcher(event, path) {
    const now = new Date();

    console.log(
      '  %s %s: %s',
      chalk.reset.green.bold.inverse(' • WAIT '),
      event,
      chalk.reset.green(join('Assets', path).replace(/\\/g, '/'))
    );
  }

  // Noraml file
  watch([
    'public/js/base/html5shiv'
  ], (event, path) => {
    const rpath = relative(join(base, 'js'), path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, join('js', rpath));

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('public/script', rpath));
      finish();
    } else {
      gulp
        .src(path, { base: 'public/js' })
        .pipe(plumber())
        .pipe(gulp.dest('public/script'))
        .on('finish', finish);
    }
  });

  // Watch js file
  watch([
    'public/js',
    '!public/js/seajs',
    '!public/js/base/json',
    '!public/js/base/es5-safe',
    '!public/js/base/html5shiv'
  ], (event, path) => {
    const rpath = relative(join(base, 'js'), path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, join('js', rpath));

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('public/script', rpath));
      finish();
    } else {
      gulp
        .src(path, { base: 'public/js' })
        .pipe(plumber())
        .pipe(cmd({
          cache: false,
          include: 'self',
          alias: getAlias(),
          base: 'public/js',
          plugins: cmdAddons(),
          map: resolveMapPath,
          css: { onpath: resolveCSSPath }
        }))
        .pipe(gulp.dest('public/script'))
        .on('finish', finish);
    }
  });

  // Watch css file
  watch('public/css', (event, path) => {
    const rpath = relative(join(base, 'css'), path);

    bookmark = Date.now();
    event = event.toLowerCase();

    debugWatcher(event, join('css', rpath));

    if (event === 'unlink' || event === 'unlinkdir') {
      rimraf.sync(resolve('public/style', rpath));
      finish();
    } else {
      gulp
        .src(path, { base: 'public/css' })
        .pipe(plumber())
        .pipe(css({
          map: resolveMapPath,
          onpath: resolveCSSPath,
          plugins: cssAddons()
        }))
        .pipe(gulp.dest('public/style'))
        .on('finish', finish);
    }
  });
});

// Product task
gulp.task('product', ['runtime-product'], () => {
  const ignore = ['jquery'];
  const smartIgnore = ignore.slice();
  // complete callback
  const complete = holding(3, () => {
    finish();
    process.stdout.write('\x07');
  });

  // Normal file
  gulp
    .src([
      'public/js/base/html5shiv/**/*'
    ], { base: 'public/js', nodir: true })
    .pipe(plumber())
    .pipe(progress())
    .pipe(compress())
    .pipe(gulp.dest('public/script'))
    .on('finish', complete);

  gulp
    .src('public/js/view/common.js', { base: 'public/js', nodir: true })
    .pipe(plumber())
    .pipe(cmd({
      cache: false,
      include: 'all',
      ignore: ignore,
      alias: getAlias(),
      base: 'public/js',
      map: resolveMapPath,
      css: { onpath: resolveCSSPath }
    }))
    .pipe(switchStream.through(function(vinyl, encoding, next) {
      cdeps(vinyl.contents).forEach((item) => {
        smartIgnore.push(item.path);
      });

      this.push(vinyl);
      next();
    }))
    .on('finish', () => {
      // Common js
      gulp
        .src('public/js/view/common.js', { base: 'public/js', nodir: true })
        .pipe(plumber())
        .pipe(progress(cmd.print))
        .pipe(cmd({
          include: 'all',
          ignore: ignore,
          alias: getAlias(),
          base: 'public/js',
          plugins: cmdAddons({ minify: true }),
          map: resolveMapPath,
          css: { onpath: resolveCSSPath }
        }))
        .pipe(gulp.dest('public/script'))
        .on('finish', complete);

      // CMD js file
      gulp
        .src([
          'public/js/**/*',
          '!public/js/seajs/**/*',
          '!public/js/view/common.js',
          '!public/js/base/json/**/*',
          '!public/js/base/es5-safe/**/*',
          '!public/js/base/html5shiv/**/*'
        ], { base: 'public/js', nodir: true })
        .pipe(plumber())
        .pipe(progress(cmd.print))
        .pipe(cmd({
          alias: getAlias(),
          base: 'public/js',
          ignore: smartIgnore,
          plugins: cmdAddons({ minify: true }),
          map: resolveMapPath,
          css: { onpath: resolveCSSPath },
          include: (id) => {
            return id && id.indexOf('view') === 0 ? 'all' : 'self';
          }
        }))
        .pipe(gulp.dest('public/script'))
        .on('finish', complete);
    });

  // CSS file
  gulp
    .src('public/css/?(default|fonts)/**/*', { base: 'public/css', nodir: true })
    .pipe(plumber())
    .pipe(progress(css.print))
    .pipe(css({
      include: true,
      map: resolveMapPath,
      onpath: resolveCSSPath,
      plugins: cssAddons({ minify: true })
    }))
    .pipe(gulp.dest('public/style'))
    .on('finish', complete);
});
