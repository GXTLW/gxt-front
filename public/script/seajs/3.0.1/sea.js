/**
 * Sea.js @VERSION | seajs.org/LICENSE.md
 */
(function (global, undefined){
  // Avoid conflicting when `sea.js` is loaded multiple times
  if (global.seajs) {
    return;
  }

  var seajs = global.seajs = {
    // The current version of Sea.js being used
    version: "3.0.1"
  };
  var data = seajs.data = {};

  /**
   * util-lang.js - The minimal language enhancement
   */
  function isType(type){
    return function (obj){
      return {}.toString.call(obj) == "[object " + type + "]";
    }
  }

  var isObject = isType("Object");
  var isString = isType("String");
  var isArray = Array.isArray || isType("Array");
  var isFunction = isType("Function");
  var isUndefined = isType("Undefined");
  var _cid = 0;

  function cid(){
    return _cid++;
  }

  /**
   * util-events.js - The minimal events support
   */
  var events = data.events = {};

  // Bind event
  seajs.on = function (name, callback){
    var list = events[name] || (events[name] = []);

    list.push(callback);

    return seajs;
  };

  // Remove event. If `callback` is undefined, remove all callbacks for the
  // event. If `event` and `callback` are both undefined, remove all callbacks
  // for all events
  seajs.off = function (name, callback){
    // Remove *all* events
    if (!(name || callback)) {
      events = data.events = {};

      return seajs;
    }

    var list = events[name];

    if (list) {
      if (callback) {
        for (var i = list.length - 1; i >= 0; i--) {
          if (list[i] === callback) {
            list.splice(i, 1);
          }
        }
      } else {
        delete events[name];
      }
    }

    return seajs;
  };

  // Emit event, firing all bound callbacks. Callbacks receive the same
  // arguments as `emit` does, apart from the event name
  var emit = seajs.emit = function (name, data){
    var list = events[name];

    if (list) {
      // Copy callback lists to prevent modification
      list = list.slice();

      // Execute event callbacks, use index because it's the faster.
      for (var i = 0, len = list.length; i < len; i++) {
        list[i](data);
      }
    }

    return seajs;
  };

  /**
   * util-path.js - The utilities for operating path such as id, uri
   */

  var DIRNAME_RE = /[^?#]*\//;
  var DOT_RE = /\/\.\//g;
  var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;
  var MULTI_SLASH_RE = /([^:/])\/+\//g;

  // Extract the directory portion of a path
  // dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
  // ref: http://jsperf.com/regex-vs-split/2
  function dirname(path){
    return path.match(DIRNAME_RE)[0];
  }

  // Canonicalize a path
  // realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
  function realpath(path){
    // /a/b/./c/./d ==> /a/b/c/d
    path = path.replace(DOT_RE, "/");

    /*
     @author wh1100717
     a//b/c ==> a/b/c
     a///b/////c ==> a/b/c
     DOUBLE_DOT_RE matches a/b/c//../d path correctly only if replace // with / first
     */
    path = path.replace(MULTI_SLASH_RE, "$1/");

    // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
    while (path.match(DOUBLE_DOT_RE)) {
      path = path.replace(DOUBLE_DOT_RE, "/");
    }

    return path;
  }

  // Normalize an id
  // normalize("path/to/a") ==> "path/to/a.js"
  // NOTICE: substring is faster than negative slice and RegExp
  function normalize(path){
    var last = path.length - 1;
    var lastC = path.charCodeAt(last);

    // If the uri ends with `#`, just return it without '#'
    if (lastC === 35 /* "#" */) {
      return path.substring(0, last);
    }

    return (path.substring(last - 2) === ".js" ||
    path.indexOf("?") > 0 ||
    lastC === 47 /* "/" */) ? path : path + ".js";
  }

  var PATHS_RE = /^([^/:]+)(\/.+)$/;
  var VARS_RE = /{([^{]+)}/g;

  function parseAlias(id){
    var alias = data.alias;
    return alias && isString(alias[id]) ? alias[id] : id;
  }

  function parsePaths(id){
    var paths = data.paths;
    var m;

    if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
      id = paths[m[1]] + m[2];
    }

    return id;
  }

  function parseVars(id){
    var vars = data.vars;

    if (vars && id.indexOf("{") > -1) {
      id = id.replace(VARS_RE, function (m, key){
        return isString(vars[key]) ? vars[key] : m;
      })
    }

    return id;
  }

  function parseMap(uri){
    var map = data.map;
    var ret = uri;

    if (map) {
      for (var i = 0, len = map.length; i < len; i++) {
        var rule = map[i];

        ret = isFunction(rule) ?
          (rule(uri) || uri) :
          uri.replace(rule[0], rule[1]);

        // Only apply the first matched rule
        if (ret !== uri) break;
      }
    }

    return ret;
  }

  var ABSOLUTE_RE = /^\/\/.|:\//;
  var ROOT_DIR_RE = /^.*?\/\/.*?\//;

  function addBase(id, refUri){
    var ret;
    var first = id.charCodeAt(0);

    // Absolute
    if (ABSOLUTE_RE.test(id)) {
      ret = id;
    }
    // Relative
    else if (first === 46 /* "." */) {
      ret = (refUri ? dirname(refUri) : data.cwd) + id;
    }
    // Root
    else if (first === 47 /* "/" */) {
      var m = data.cwd.match(ROOT_DIR_RE);

      ret = m ? m[0] + id.substring(1) : id;
    }
    // Top-level
    else {
      ret = data.base + id;
    }

    // Add default protocol when uri begins with "//"
    if (ret.indexOf("//") === 0) {
      ret = location.protocol + ret;
    }

    return realpath(ret);
  }

  function id2Uri(id, refUri){
    if (!id) return "";

    id = parseAlias(id);
    id = parsePaths(id);
    id = parseAlias(id);
    id = parseVars(id);
    id = parseAlias(id);
    id = normalize(id);
    id = parseAlias(id);

    var uri = addBase(id, refUri);
    uri = parseAlias(uri);
    uri = parseMap(uri);

    return uri;
  }

  // For Developers
  seajs.resolve = id2Uri;

  // Check environment
  var isWebWorker = typeof window === 'undefined' && typeof importScripts !== 'undefined' && isFunction(importScripts);
  // Ignore about:xxx and blob:xxx
  var IGNORE_LOCATION_RE = /^(about|blob):/;
  var loaderDir;
  // Sea.js's full path
  var loaderPath;
  // Location is read-only from web worker, should be ok though
  var cwd = (!location.href || IGNORE_LOCATION_RE.test(location.href)) ? '' : dirname(location.href);

  if (isWebWorker) {
    // Web worker doesn't create DOM object when loading scripts
    // Get sea.js's path by stack trace.
    var stack;

    try {
      var up = new Error();

      throw up;
    } catch (e) {
      // IE won't set Error.stack until thrown
      stack = e.stack.split('\n');
    }

    // First line is 'Error'
    stack.shift();

    var m;
    // Try match `url:row:col` from stack trace line. Known formats:
    // Chrome:  '    at http://localhost:8000/script/sea-worker-debug.js:294:25'
    // FireFox: '@http://localhost:8000/script/sea-worker-debug.js:1082:1'
    // IE11:    '   at Anonymous function (http://localhost:8000/script/sea-worker-debug.js:295:5)'
    // Don't care about older browsers since web worker is an HTML5 feature
    var TRACE_RE = /.*?((?:http|https|file)(?::\/{2}[\w]+)(?:[\/|\.]?)(?:[^\s"]*)).*?/i;
    // Try match `url` (Note: in IE there will be a tailing ')')
    var URL_RE = /(.*?):\d+:\d+\)?$/;
    // Find url of from stack trace.
    // Cannot simply read the first one because sometimes we will get:
    // Error
    //  at Error (native) <- Here's your problem
    //  at http://localhost:8000/_site/dist/sea.js:2:4334 <- What we want
    //  at http://localhost:8000/_site/dist/sea.js:2:8386
    //  at http://localhost:8000/_site/tests/specs/web-worker/worker.js:3:1
    while (stack.length > 0) {
      var top = stack.shift();

      m = TRACE_RE.exec(top);

      if (m != null) {
        break;
      }
    }

    var url;

    if (m != null) {
      // Remove line number and column number
      // No need to check, can't be wrong at this point
      var url = URL_RE.exec(m[1])[1];
    }

    // Set
    loaderPath = url;
    // Set loaderDir
    loaderDir = dirname(url || cwd);

    // This happens with inline worker.
    // When entrance script's location.href is a blob url,
    // cwd will not be available.
    // Fall back to loaderDir.
    if (cwd === '') {
      cwd = loaderDir;
    }
  } else {
    var doc = document;
    var scripts = doc.scripts;
    // Recommend to add `seajsnode` id for the `sea.js` script element
    var loaderScript = doc.getElementById("seajsnode") ||
      scripts[scripts.length - 1];

    function getScriptAbsoluteSrc(node){
      return node.hasAttribute ? // non-IE6/7
        node.src :
        // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        node.getAttribute("src", 4);
    }

    loaderPath = getScriptAbsoluteSrc(loaderScript);
    // When `sea.js` is inline, set loaderDir to current working directory
    loaderDir = dirname(loaderPath || cwd);
  }

  /**
   * util-request.js - The utilities for requesting script and style files
   * ref: tests/research/load-js-css/test.html
   */
  if (isWebWorker) {
    function requestFromWebWorker(url, callback, charset, crossorigin){
      // Load with importScripts
      var error;

      try {
        importScripts(url);
      } catch (e) {
        error = e;
      }

      callback(error);
    }

    // For Developers
    seajs.request = requestFromWebWorker;
  } else {
    var doc = document;
    var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
    var baseElement = head.getElementsByTagName("base")[0];
    var currentlyAddingScript;

    function request(url, callback, charset, crossorigin){
      var node = doc.createElement("script");

      if (charset) {
        node.charset = charset;
      }

      if (!isUndefined(crossorigin)) {
        node.setAttribute("crossorigin", crossorigin);
      }

      addOnload(node, callback, url);

      node.async = true;
      node.src = url;

      // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
      // the end of the insert execution, so use `currentlyAddingScript` to
      // hold current node, for deriving url in `define` call
      currentlyAddingScript = node;

      // ref: #185 & http://dev.jquery.com/ticket/2709
      baseElement ?
        head.insertBefore(node, baseElement) :
        head.appendChild(node);

      currentlyAddingScript = null;
    }

    function addOnload(node, callback, url){
      var supportOnload = "onload" in node;

      if (supportOnload) {
        node.onload = onload;
        node.onerror = function (){
          emit("error", { uri: url, node: node });
          onload(true);
        }
      } else {
        node.onreadystatechange = function (){
          if (/loaded|complete/.test(node.readyState)) {
            onload();
          }
        }
      }

      function onload(error){
        // Ensure only run once and handle memory leak in IE
        node.onload = node.onerror = node.onreadystatechange = null;

        // Remove the script to reduce memory leak
        if (!data.debug) {
          head.removeChild(node);
        }

        // Dereference the node
        node = null;

        callback(error);
      }
    }

    // For Developers
    seajs.request = request;
  }

  /**
   * module.js - The core of module loader
   */
  var cachedMods = seajs.cache = {};
  var anonymousMeta;
  var fetchingList = {};
  var fetchedList = {};
  var callbackList = {};
  var STATUS = Module.STATUS = {
    // 1 - The `module.uri` is being fetched
    FETCHING: 1,
    // 2 - The meta data has been saved to cachedMods
    SAVED: 2,
    // 3 - The `module.dependencies` are being loaded
    LOADING: 3,
    // 4 - The module are ready to execute
    LOADED: 4,
    // 5 - The module is being executed
    EXECUTING: 5,
    // 6 - The `module.exports` is available
    EXECUTED: 6,
    // 7 - 404
    ERROR: 7
  };

  function Module(uri, deps){
    this.uri = uri;
    this.dependencies = deps || [];
    this.deps = {}; // Ref the dependence modules
    this.status = 0;
    this._entry = [];
  }

  // Resolve module.dependencies
  Module.prototype.resolve = function (){
    var mod = this;
    var ids = mod.dependencies;
    var uris = [];

    for (var i = 0, len = ids.length; i < len; i++) {
      uris[i] = Module.resolve(ids[i], mod.uri);
    }

    return uris;
  };

  Module.prototype.pass = function (){
    var mod = this;
    var len = mod.dependencies.length;

    for (var i = 0; i < mod._entry.length; i++) {
      var entry = mod._entry[i];
      var count = 0;

      for (var j = 0; j < len; j++) {
        var m = mod.deps[mod.dependencies[j]];

        // If the module is unload and unused in the entry, pass entry to it
        if (m.status < STATUS.LOADED && !entry.history.hasOwnProperty(m.uri)) {
          entry.history[m.uri] = true;

          count++;
          m._entry.push(entry);

          if (m.status === STATUS.LOADING) {
            m.pass();
          }
        }
      }

      // If has passed the entry to it's dependencies, modify the entry's count and del it in the module
      if (count > 0) {
        entry.remain += count - 1;
        mod._entry.shift();
        i--;
      }
    }
  };

  // Load module.dependencies and fire onload when all done
  Module.prototype.load = function (){
    var mod = this;

    // If the module is being loaded, just wait it onload call
    if (mod.status >= STATUS.LOADING) {
      return;
    }

    mod.status = STATUS.LOADING;

    // Emit `load` event for plugins such as combo plugin
    var uris = mod.resolve();

    emit("load", uris);

    for (var i = 0, len = uris.length; i < len; i++) {
      mod.deps[mod.dependencies[i]] = Module.get(uris[i]);
    }

    // Pass entry to it's dependencies
    mod.pass();

    // If module has entries not be passed, call onload
    if (mod._entry.length) {
      mod.onload();

      return;
    }

    // Begin parallel loading
    var requestCache = {};
    var m;

    for (i = 0; i < len; i++) {
      m = cachedMods[uris[i]];

      if (m.status < STATUS.FETCHING) {
        m.fetch(requestCache);
      } else if (m.status === STATUS.SAVED) {
        m.load();
      }
    }

    // Send all requests at last to avoid cache bug in IE6-9. Issues#808
    for (var requestUri in requestCache) {
      if (requestCache.hasOwnProperty(requestUri)) {
        requestCache[requestUri]();
      }
    }
  };

  // Call this method when module is loaded
  Module.prototype.onload = function (){
    var mod = this;

    mod.status = STATUS.LOADED;

    // When sometimes cached in IE, exec will occur before onload, make sure len is an number
    for (var i = 0, len = (mod._entry || []).length; i < len; i++) {
      var entry = mod._entry[i];

      if (--entry.remain === 0) {
        entry.callback();
      }
    }

    delete mod._entry;
  };

  // Call this method when module is 404
  Module.prototype.error = function (){
    var mod = this;

    mod.onload();

    mod.status = STATUS.ERROR;
  };

  // Execute a module
  Module.prototype.exec = function (){
    var mod = this;

    // When module is executed, DO NOT execute it again. When module
    // is being executed, just return `module.exports` too, for avoiding
    // circularly calling
    if (mod.status >= STATUS.EXECUTING) {
      return mod.exports;
    }

    mod.status = STATUS.EXECUTING;

    if (mod._entry && !mod._entry.length) {
      delete mod._entry;
    }

    //non-cmd module has no property factory and exports
    if (!mod.hasOwnProperty('factory')) {
      mod.non = true;

      return;
    }

    // Create require
    var uri = mod.uri;

    function require(id){
      var m = mod.deps[id] || Module.get(require.resolve(id));

      if (m.status == STATUS.ERROR) {
        throw new Error('module was broken: ' + m.uri);
      }

      return m.exec();
    }

    require.resolve = function (id){
      return Module.resolve(id, uri);
    };

    require.async = function (ids, callback){
      Module.use(ids, callback, uri + "_async_" + cid());

      return require;
    };

    // Exec factory
    var factory = mod.factory;

    var exports = isFunction(factory) ?
      factory.call(mod.exports = {}, require, mod.exports, mod) :
      factory;

    if (exports === undefined) {
      exports = mod.exports;
    }

    // Reduce memory leak
    delete mod.factory;

    mod.exports = exports;
    mod.status = STATUS.EXECUTED;

    // Emit `exec` event
    emit("exec", mod);

    return mod.exports;
  };

  // Fetch a module
  Module.prototype.fetch = function (requestCache){
    var mod = this;
    var uri = mod.uri;

    mod.status = STATUS.FETCHING;

    // Emit `fetch` event for plugins such as combo plugin
    var emitData = { uri: uri };

    emit("fetch", emitData);

    var requestUri = emitData.requestUri || uri;

    // Empty uri or a non-CMD module
    if (!requestUri || fetchedList.hasOwnProperty(requestUri)) {
      mod.load();

      return;
    }

    if (fetchingList.hasOwnProperty(requestUri)) {
      callbackList[requestUri].push(mod);

      return;
    }

    fetchingList[requestUri] = true;
    callbackList[requestUri] = [mod];

    // Emit `request` event for plugins such as text plugin
    emit("request", emitData = {
      uri: uri,
      requestUri: requestUri,
      onRequest: onRequest,
      charset: isFunction(data.charset) ? data.charset(requestUri) : data.charset,
      crossorigin: isFunction(data.crossorigin) ? data.crossorigin(requestUri) : data.crossorigin
    });

    if (!emitData.requested) {
      requestCache ?
        requestCache[emitData.requestUri] = sendRequest :
        sendRequest();
    }

    function sendRequest(){
      seajs.request(emitData.requestUri, emitData.onRequest, emitData.charset, emitData.crossorigin);
    }

    function onRequest(error){
      delete fetchingList[requestUri];
      fetchedList[requestUri] = true;

      // Save meta data of anonymous module
      if (anonymousMeta) {
        Module.save(uri, anonymousMeta);
        anonymousMeta = null;
      }

      // Call callbacks
      var m, mods = callbackList[requestUri];

      delete callbackList[requestUri];

      while ((m = mods.shift())) {
        // When 404 occurs, the params error will be true
        if (error === true) {
          m.error();
        } else {
          m.load();
        }
      }
    }
  };

  // Resolve id to uri
  Module.resolve = function (id, refUri){
    // Emit `resolve` event for plugins such as text plugin
    var emitData = { id: id, refUri: refUri };

    emit("resolve", emitData);

    return emitData.uri || seajs.resolve(emitData.id, refUri);
  };

  // Define a module
  Module.define = function (id, deps, factory){
    var argsLen = arguments.length;

    // define(factory)
    if (argsLen === 1) {
      factory = id;
      id = undefined;
    } else if (argsLen === 2) {
      factory = deps;

      // define(deps, factory)
      if (isArray(id)) {
        deps = id;
        id = undefined;
      }
      // define(id, factory)
      else {
        deps = undefined;
      }
    }

    // Parse dependencies according to the module factory code
    if (!isArray(deps) && isFunction(factory)) {
      deps = typeof parseDependencies === "undefined" ? [] : parseDependencies(factory.toString());
    }

    var meta = {
      id: id,
      uri: Module.resolve(id),
      deps: deps,
      factory: factory
    };

    // Try to derive uri in IE6-9 for anonymous modules
    if (!isWebWorker && !meta.uri && doc.attachEvent && typeof getCurrentScript !== "undefined") {
      var script = getCurrentScript();

      if (script) {
        meta.uri = script.src;
      }
      // NOTE: If the id-deriving methods above is failed, then falls back
      // to use onload event to get the uri
    }

    // Emit `define` event, used in nocache plugin, seajs node version etc
    emit("define", meta);

    meta.uri ? Module.save(meta.uri, meta) :
      // Save information for "saving" work in the script onload event
      anonymousMeta = meta;
  };

  // Save meta data to cachedMods
  Module.save = function (uri, meta){
    var mod = Module.get(uri);

    // Do NOT override already saved modules
    if (mod.status < STATUS.SAVED) {
      mod.id = meta.id || uri;
      mod.dependencies = meta.deps || [];
      mod.factory = meta.factory;
      mod.status = STATUS.SAVED;

      emit("save", mod);
    }
  };

  // Get an existed module or create a new one
  Module.get = function (uri, deps){
    return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps));
  };

  // Use function is equal to load a anonymous module
  Module.use = function (ids, callback, uri){
    var mod = Module.get(uri, isArray(ids) ? ids : [ids]);

    mod._entry.push(mod);
    mod.history = {};
    mod.remain = 1;

    mod.callback = function (){
      var exports = [];
      var uris = mod.resolve();

      for (var i = 0, len = uris.length; i < len; i++) {
        exports[i] = cachedMods[uris[i]].exec();
      }

      if (callback) {
        callback.apply(global, exports);
      }

      delete mod.callback;
      delete mod.history;
      delete mod.remain;
      delete mod._entry;
    };

    mod.load();
  };

  // Public API
  seajs.use = function (ids, callback){
    Module.use(ids, callback, data.cwd + "_use_" + cid());

    return seajs;
  };

  Module.define.cmd = {};
  global.define = Module.define;

  // For Developers
  seajs.Module = Module;
  data.fetchedList = fetchedList;
  data.cid = cid;

  seajs.require = function (id){
    var mod = Module.get(Module.resolve(id));

    if (mod.status < STATUS.EXECUTING) {
      mod.onload();
      mod.exec();
    }

    return mod.exports;
  };

  /**
   * config.js - The configuration for the loader
   */

  // The root path to use for id2uri parsing
  data.base = loaderDir;

  // The loader directory
  data.dir = loaderDir;

  // The loader's full path
  data.loader = loaderPath;

  // The current working directory
  data.cwd = cwd;

  // The charset for requesting files
  data.charset = "utf-8";

  // @Retention(RetentionPolicy.SOURCE)
  // The CORS options, Don't set CORS on default.
  //
  //data.crossorigin = undefined
  // data.alias - An object containing shorthands of module id
  // data.paths - An object containing path shorthands in module id
  // data.vars - The {xxx} variables in module id
  // data.map - An array containing rules to map module uri
  // data.debug - Debug mode. The default value is false
  seajs.config = function (configData){
    for (var key in configData) {
      var curr = configData[key];
      var prev = data[key];

      // Merge object config such as alias, vars
      if (prev && isObject(prev)) {
        for (var k in curr) {
          prev[k] = curr[k];
        }
      } else {
        // Concat array config such as map
        if (isArray(prev)) {
          curr = prev.concat(curr);
        }
        // Make sure that `data.base` is an absolute path
        else if (key === "base") {
          // Make sure end with "/"
          if (curr.slice(-1) !== "/") {
            curr += "/";
          }

          curr = addBase(curr);
        }

        // Set config
        data[key] = curr;
      }
    }

    emit("config", configData);

    return seajs;
  };
})(this);

/**
 * The Sea.js plugin to provide log function
 */
(function (seajs, global){
  var slice = [].slice;
  var data = seajs.data;

  // The safe wrapper for `console.xxx` functions
  // log('message') ==> console.log('message')
  // log('message', 'warn') ==> console.warn('message')
  seajs.log = function (){
    var msg;
    var type;

    // Do NOT print `log(msg)` in non-debug mode
    // Do NOT print `log(msg)` in non-support console
    if (data.debug && global.console) {
      if (arguments.length > 1) {
        type = slice.call(arguments, -1);

        if (global.console[type]) {
          msg = slice.call(arguments, 0, -1);
        } else {
          type = 'log';
          msg = slice.call(arguments, 0);
        }
      } else {
        type = 'log';
        msg = slice.call(arguments, 0);
      }

      // Call native method of console
      if (typeof global.console[type] === 'object') {
        seajs.log.apply.call(global.console[type], global.console, msg)
      } else {
        global.console[type].apply(global.console, msg);
      }
    }
  };
})(seajs, window);

/**
 * seajs config
 */
(function (seajs, window, undefined){
  // init config
  seajs.config({
    debug: GXT.DEBUG,
    base: GXT.ROOT,
    map: [
      [/\.(js|css)$/i, '.$1?version=' + GXT.VERSION]
    ]
  });
})(seajs, window);

/*
 json2.js
 2015-05-03

 Public Domain.

 NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

 See http://www.JSON.org/js.html


 This code should be minified before deployment.
 See http://javascript.crockford.com/jsmin.html

 USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
 NOT CONTROL.


 This file creates a global JSON object containing two methods: stringify
 and parse. This file is provides the ES5 JSON capability to ES3 systems.
 If a project might run on IE8 or earlier, then this file should be included.
 This file does nothing on ES5 systems.

 JSON.stringify(value, replacer, space)
 value       any JavaScript value, usually an object or array.

 replacer    an optional parameter that determines how object
 values are stringified for objects. It can be a
 function or an array of strings.

 space       an optional parameter that specifies the indentation
 of nested structures. If it is omitted, the text will
 be packed without extra whitespace. If it is a number,
 it will specify the number of spaces to indent at each
 level. If it is a string (such as '\t' or '&nbsp;'),
 it contains the characters used to indent at each level.

 This method produces a JSON text from a JavaScript value.

 When an object value is found, if the object contains a toJSON
 method, its toJSON method will be called and the result will be
 stringified. A toJSON method does not serialize: it returns the
 value represented by the name/value pair that should be serialized,
 or undefined if nothing should be serialized. The toJSON method
 will be passed the key associated with the value, and this will be
 bound to the value

 For example, this would serialize Dates as ISO strings.

 Date.prototype.toJSON = function (key) {
 function f(n) {
 // Format integers to have at least two digits.
 return n < 10
 ? '0' + n
 : n;
 }

 return this.getUTCFullYear()   + '-' +
 f(this.getUTCMonth() + 1) + '-' +
 f(this.getUTCDate())      + 'T' +
 f(this.getUTCHours())     + ':' +
 f(this.getUTCMinutes())   + ':' +
 f(this.getUTCSeconds())   + 'Z';
 };

 You can provide an optional replacer method. It will be passed the
 key and value of each member, with this bound to the containing
 object. The value that is returned from your method will be
 serialized. If your method returns undefined, then the member will
 be excluded from the serialization.

 If the replacer parameter is an array of strings, then it will be
 used to select the members to be serialized. It filters the results
 such that only members with keys listed in the replacer array are
 stringified.

 Values that do not have JSON representations, such as undefined or
 functions, will not be serialized. Such values in objects will be
 dropped; in arrays they will be replaced with null. You can use
 a replacer function to replace those with JSON values.
 JSON.stringify(undefined) returns undefined.

 The optional space parameter produces a stringification of the
 value that is filled with line breaks and indentation to make it
 easier to read.

 If the space parameter is a non-empty string, then that string will
 be used for indentation. If the space parameter is a number, then
 the indentation will be that many spaces.

 Example:

 text = JSON.stringify(['e', {pluribus: 'unum'}]);
 // text is '["e",{"pluribus":"unum"}]'


 text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
 // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

 text = JSON.stringify([new Date()], function (key, value) {
 return this[key] instanceof Date
 ? 'Date(' + this[key] + ')'
 : value;
 });
 // text is '["Date(---current time---)"]'


 JSON.parse(text, reviver)
 This method parses a JSON text to produce an object or array.
 It can throw a SyntaxError exception.

 The optional reviver parameter is a function that can filter and
 transform the results. It receives each of the keys and values,
 and its return value is used instead of the original value.
 If it returns what it received, then the structure is not modified.
 If it returns undefined then the member is deleted.

 Example:

 // Parse the text. Values that look like ISO date strings will
 // be converted to Date objects.

 myData = JSON.parse(text, function (key, value) {
 var a;
 if (typeof value === 'string') {
 a =
 /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
 if (a) {
 return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
 +a[5], +a[6]));
 }
 }
 return value;
 });

 myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
 var d;
 if (typeof value === 'string' &&
 value.slice(0, 5) === 'Date(' &&
 value.slice(-1) === ')') {
 d = new Date(value.slice(5, -1));
 if (d) {
 return d;
 }
 }
 return value;
 });


 This is a reference implementation. You are free to copy, modify, or
 redistribute.
 */

/*jslint 
 eval, for, this
 */

/*property
 JSON, apply, call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
 getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
 lastIndex, length, parse, prototype, push, replace, slice, stringify,
 test, toJSON, toString, valueOf
 */


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
  JSON = {};
}

(function (){
  'use strict';

  var rx_one = /^[\],:{}\s]*$/,
    rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
    rx_four = /(?:^|:|,)(?:\s*\[)+/g,
    rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  function f(n){
    // Format integers to have at least two digits.
    return n < 10
      ? '0' + n
      : n;
  }

  function this_value(){
    return this.valueOf();
  }

  if (typeof Date.prototype.toJSON !== 'function') {

    Date.prototype.toJSON = function (){

      return isFinite(this.valueOf())
        ? this.getUTCFullYear() + '-' +
      f(this.getUTCMonth() + 1) + '-' +
      f(this.getUTCDate()) + 'T' +
      f(this.getUTCHours()) + ':' +
      f(this.getUTCMinutes()) + ':' +
      f(this.getUTCSeconds()) + 'Z'
        : null;
    };

    Boolean.prototype.toJSON = this_value;
    Number.prototype.toJSON = this_value;
    String.prototype.toJSON = this_value;
  }

  var gap,
    indent,
    meta,
    rep;

  function quote(string){

    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.

    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string)
      ? '"' + string.replace(rx_escapable, function (a){
      var c = meta[a];
      return typeof c === 'string'
        ? c
        : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"'
      : '"' + string + '"';
  }

  function str(key, holder){

    // Produce a string from holder[key].

    var i,          // The loop counter.
      k,          // The member key.
      v,          // The member value.
      length,
      mind = gap,
      partial,
      value = holder[key];

    // If the value has a toJSON method, call it to obtain a replacement value.

    if (value && typeof value === 'object' &&
      typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }

    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.

    if (typeof rep === 'function') {
      value = rep.call(holder, key, value);
    }

    // What happens next depends on the value's type.

    switch (typeof value) {
      case 'string':
        return quote(value);

      case 'number':

        // JSON numbers must be finite. Encode non-finite numbers as null.

        return isFinite(value)
          ? String(value)
          : 'null';

      case 'boolean':
      case 'null':

        // If the value is a boolean or null, convert it to a string. Note:
        // typeof null does not produce 'null'. The case is included here in
        // the remote chance that this gets fixed someday.

        return String(value);

      // If the type is 'object', we might be dealing with an object or an array or
      // null.

      case 'object':

        // Due to a specification blunder in ECMAScript, typeof null is 'object',
        // so watch out for that case.

        if (!value) {
          return 'null';
        }

        // Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

        // Is the value an array?

        if (Object.prototype.toString.apply(value) === '[object Array]') {

          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.

          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || 'null';
          }

          // Join all of the elements together, separated with commas, and wrap them in
          // brackets.

          v = partial.length === 0
            ? '[]'
            : gap
            ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
            : '[' + partial.join(',') + ']';
          gap = mind;
          return v;
        }

        // If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === 'object') {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === 'string') {
              k = rep[i];
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (
                    gap
                      ? ': '
                      : ':'
                  ) + v);
              }
            }
          }
        } else {

          // Otherwise, iterate through all of the keys in the object.

          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (
                    gap
                      ? ': '
                      : ':'
                  ) + v);
              }
            }
          }
        }

        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0
          ? '{}'
          : gap
          ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
          : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
  }

  // If the JSON object does not yet have a stringify method, give it one.

  if (typeof JSON.stringify !== 'function') {
    meta = {    // table of character substitutions
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '"': '\\"',
      '\\': '\\\\'
    };
    JSON.stringify = function (value, replacer, space){

      // The stringify method takes a value and an optional replacer, and an optional
      // space parameter, and returns a JSON text. The replacer can be a function
      // that can replace values, or an array of strings that will select the keys.
      // A default replacer method can be provided. Use of the space parameter can
      // produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

      // If the space parameter is a number, make an indent string containing that
      // many spaces.

      if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
          indent += ' ';
        }

        // If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
        indent = space;
      }

      // If there is a replacer, it must be a function or an array.
      // Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
        (typeof replacer !== 'object' ||
        typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
      }

      // Make a fake root object containing our value under the key of ''.
      // Return the result of stringifying the value.

      return str('', { '': value });
    };
  }

  // If the JSON object does not yet have a parse method, give it one.

  if (typeof JSON.parse !== 'function') {
    JSON.parse = function (text, reviver){

      // The parse method takes a text and an optional reviver function, and returns
      // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key){

        // The walk method is used to recursively walk the resulting structure so
        // that modifications can be made.

        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = walk(value, k);
              if (v !== undefined) {
                value[k] = v;
              } else {
                delete value[k];
              }
            }
          }
        }
        return reviver.call(holder, key, value);
      }

      // Parsing happens in four stages. In the first stage, we replace certain
      // Unicode characters with escape sequences. JavaScript handles many characters
      // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      rx_dangerous.lastIndex = 0;
      if (rx_dangerous.test(text)) {
        text = text.replace(rx_dangerous, function (a){
          return '\\u' +
            ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        });
      }

      // In the second stage, we run the text against regular expressions that look
      // for non-JSON patterns. We are especially concerned with '()' and 'new'
      // because they can cause invocation, and '=' because it can cause mutation.
      // But just to be safe, we want to reject all unexpected forms.

      // We split the second stage into 4 regexp operations in order to work around
      // crippling inefficiencies in IE's and Safari's regexp engines. First we
      // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
      // replace all simple value tokens with ']' characters. Third, we delete all
      // open brackets that follow a colon or comma or that begin the text. Finally,
      // we look to see that the remaining characters are only whitespace or ']' or
      // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (
        rx_one.test(
          text
            .replace(rx_two, '@')
            .replace(rx_three, ']')
            .replace(rx_four, '')
        )
      ) {

        // In the third stage we use the eval function to compile the text into a
        // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
        // in JavaScript: it can begin a block or an object literal. We wrap the text
        // in parens to eliminate the ambiguity.

        j = eval('(' + text + ')');

        // In the optional fourth stage, we recursively walk the new structure, passing
        // each name/value pair to a reviver function for possible transformation.

        return typeof reviver === 'function'
          ? walk({ '': j }, '')
          : j;
      }

      // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
    };
  }
}());

(function (){

  // es5-safe
  // ----------------
  // Provides compatibility shims so that legacy JavaScript engines behave as
  // closely as possible to ES5.
  //
  // Thanks to:
  //  - http://es5.github.com/
  //  - http://kangax.github.com/es5-compat-table/
  //  - https://github.com/kriskowal/es5-shim
  //  - http://perfectionkills.com/extending-built-in-native-objects-evil-or-not/
  //  - https://gist.github.com/1120592
  //  - https://code.google.com/p/v8/

  var OP = Object.prototype;
  var AP = Array.prototype;
  var FP = Function.prototype;
  var SP = String.prototype;
  var hasOwnProperty = OP.hasOwnProperty;
  var slice = AP.slice;

  /*---------------------------------------*
   * Function
   *---------------------------------------*/

  // ES-5 15.3.4.5
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
  FP.bind || (FP.bind = function (that){
    var target = this;

    // If IsCallable(func) is false, throw a TypeError exception.
    if (typeof target !== 'function') {
      throw new TypeError('Bind must be called on a function');
    }

    var boundArgs = slice.call(arguments, 1);

    function bound(){
      // Called as a constructor.
      if (this instanceof bound) {
        var self = createObject(target.prototype);
        var result = target.apply(
          self,
          boundArgs.concat(slice.call(arguments))
        );

        return Object(result) === result ? result : self;
      }
      // Called as a function.
      else {
        return target.apply(
          that,
          boundArgs.concat(slice.call(arguments))
        );
      }
    }

    // NOTICE: The function.length is not writable.
    //bound.length = Math.max(target.length - boundArgs.length, 0);

    return bound;
  });

  // Helpers
  function createObject(proto){
    var o;

    if (Object.create) {
      o = Object.create(proto);
    } else {
      /** @constructor */
      function F(){
      }

      F.prototype = proto;
      o = new F();
    }

    return o;
  }

  /*---------------------------------------*
   * Object
   *---------------------------------------*/
  // http://ejohn.org/blog/ecmascript-5-objects-and-properties/

  // ES5 15.2.3.14
  // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
  // https://developer.mozilla.org/en/ECMAScript_DontEnum_attribute
  // http://msdn.microsoft.com/en-us/library/adebfyya(v=vs.94).aspx
  Object.keys || (Object.keys = (function (){
    var hasDontEnumBug = !{ toString: '' }.propertyIsEnumerable('toString');
    var DontEnums = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor'
    ];
    var DontEnumsLength = DontEnums.length;

    return function (o){
      if (o !== Object(o)) {
        throw new TypeError(o + ' is not an object');
      }

      var result = [];

      for (var name in o) {
        if (hasOwnProperty.call(o, name)) {
          result.push(name);
        }
      }

      if (hasDontEnumBug) {
        for (var i = 0; i < DontEnumsLength; i++) {
          if (hasOwnProperty.call(o, DontEnums[i])) {
            result.push(DontEnums[i]);
          }
        }
      }

      return result;
    };
  })());

  /*---------------------------------------*
   * Array
   *---------------------------------------*/
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array
  // https://github.com/kangax/fabric.js/blob/gh-pages/src/util/lang_array.js

  // ES5 15.4.3.2
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
  Array.isArray || (Array.isArray = function (obj){
    return OP.toString.call(obj) === '[object Array]';
  });

  // ES5 15.4.4.18
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach
  AP.forEach || (AP.forEach = function (fn, context){
    for (var i = 0, len = this.length >>> 0; i < len; i++) {
      if (i in this) {
        fn.call(context, this[i], i, this);
      }
    }
  });

  // ES5 15.4.4.19
  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
  AP.map || (AP.map = function (fn, context){
    var len = this.length >>> 0;
    var result = new Array(len);

    for (var i = 0; i < len; i++) {
      if (i in this) {
        result[i] = fn.call(context, this[i], i, this);
      }
    }

    return result;
  });

  // ES5 15.4.4.20
  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
  AP.filter || (AP.filter = function (fn, context){
    var result = [], val;

    for (var i = 0, len = this.length >>> 0; i < len; i++) {
      if (i in this) {
        val = this[i]; // in case fn mutates this

        if (fn.call(context, val, i, this)) {
          result.push(val);
        }
      }
    }

    return result;
  });

  // ES5 15.4.4.16
  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/every
  AP.every || (AP.every = function (fn, context){
    for (var i = 0, len = this.length >>> 0; i < len; i++) {
      if (i in this && !fn.call(context, this[i], i, this)) {
        return false;
      }
    }

    return true;
  });

  // ES5 15.4.4.17
  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/some
  AP.some || (AP.some = function (fn, context){
    for (var i = 0, len = this.length >>> 0; i < len; i++) {
      if (i in this && fn.call(context, this[i], i, this)) {
        return true;
      }
    }
    return false;
  });

  // ES5 15.4.4.21
  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
  AP.reduce || (AP.reduce = function (fn /*, initial*/){
    if (typeof fn !== 'function') {
      throw new TypeError(fn + ' is not an function');
    }

    var len = this.length >>> 0, i = 0, result;

    if (arguments.length > 1) {
      result = arguments[1];
    } else {
      do {
        if (i in this) {
          result = this[i++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++i >= len) {
          throw new TypeError('reduce of empty array with on initial value');
        }
      } while (true);
    }

    for (; i < len; i++) {
      if (i in this) {
        result = fn.call(null, result, this[i], i, this);
      }
    }

    return result;
  });

  // ES5 15.4.4.22
  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
  AP.reduceRight || (AP.reduceRight = function (fn /*, initial*/){
    if (typeof fn !== 'function') {
      throw new TypeError(fn + ' is not an function');
    }

    var len = this.length >>> 0, i = len - 1, result;

    if (arguments.length > 1) {
      result = arguments[1];
    } else {
      do {
        if (i in this) {
          result = this[i--];
          break;
        }

        // if array contains no values, no initial value to return
        if (--i < 0)
          throw new TypeError('reduce of empty array with on initial value');
      } while (true);
    }

    for (; i >= 0; i--) {
      if (i in this) {
        result = fn.call(null, result, this[i], i, this);
      }
    }

    return result;
  });

  // ES5 15.4.4.14
  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/indexOf
  AP.indexOf || (AP.indexOf = function (value, from){
    var len = this.length >>> 0;

    from = Number(from) || 0;
    from = Math[from < 0 ? 'ceil' : 'floor'](from);

    if (from < 0) {
      from = Math.max(from + len, 0);
    }

    for (; from < len; from++) {
      if (from in this && this[from] === value) {
        return from;
      }
    }

    return -1;
  });

  // ES5 15.4.4.15
  // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/indexOf
  AP.lastIndexOf || (AP.lastIndexOf = function (value, from){
    var len = this.length >>> 0;

    from = Number(from) || len - 1;
    from = Math[from < 0 ? 'ceil' : 'floor'](from);

    if (from < 0) {
      from += len;
    }

    from = Math.min(from, len - 1);

    for (; from >= 0; from--) {
      if (from in this && this[from] === value) {
        return from;
      }
    }

    return -1;
  });

  /*---------------------------------------*
   * String
   *---------------------------------------*/

  // ES5 15.5.4.20
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/trim
  // http://blog.stevenlevithan.com/archives/faster-trim-javascript
  // http://jsperf.com/mega-trim-test
  SP.trim || (SP.trim = (function (){

    // http://perfectionkills.com/whitespace-deviations/
    var whiteSpaces = [

      '\\s',
      //'0009', // 'HORIZONTAL TAB'
      //'000A', // 'LINE FEED OR NEW LINE'
      //'000B', // 'VERTICAL TAB'
      //'000C', // 'FORM FEED'
      //'000D', // 'CARRIAGE RETURN'
      //'0020', // 'SPACE'

      '00A0', // 'NO-BREAK SPACE'
      '1680', // 'OGHAM SPACE MARK'
      '180E', // 'MONGOLIAN VOWEL SEPARATOR'

      '2000-\\u200A',
      //'2000', // 'EN QUAD'
      //'2001', // 'EM QUAD'
      //'2002', // 'EN SPACE'
      //'2003', // 'EM SPACE'
      //'2004', // 'THREE-PER-EM SPACE'
      //'2005', // 'FOUR-PER-EM SPACE'
      //'2006', // 'SIX-PER-EM SPACE'
      //'2007', // 'FIGURE SPACE'
      //'2008', // 'PUNCTUATION SPACE'
      //'2009', // 'THIN SPACE'
      //'200A', // 'HAIR SPACE'

      '200B', // 'ZERO WIDTH SPACE (category Cf)
      '2028', // 'LINE SEPARATOR'
      '2029', // 'PARAGRAPH SEPARATOR'
      '202F', // 'NARROW NO-BREAK SPACE'
      '205F', // 'MEDIUM MATHEMATICAL SPACE'
      '3000' //  'IDEOGRAPHIC SPACE'

    ].join('\\u');

    var trimLeftReg = new RegExp('^[' + whiteSpaces + ']+');
    var trimRightReg = new RegExp('[' + whiteSpaces + ']+$');

    return function (){
      return String(this).replace(trimLeftReg, '').replace(trimRightReg, '');
    }
  })());

  /*---------------------------------------*
   * Date
   *---------------------------------------*/

  // ES5 15.9.4.4
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/now
  Date.now || (Date.now = function (){
    return +new Date;
  });
})();
