/**
 * Created by nuintun on 2016/9/26.
 */

'use strict';

const path = require('path');
const send = require('koa-send');
const util = require('../lib/util');

/**
 * serve
 * @param path
 * @param root
 * @param options
 * @returns {Function}
 */
function serve(path, root, options){
  // remove / begin
  path = path.replace(/^\/+/, '');
  options = options || {};
  options.root = root || util.cwd;

  return function (ctx, next){
    if (ctx.method === 'HEAD' || ctx.method === 'GET') {
      let req_path_array = ctx.path.slice(1).split('/');

      // match path
      if (path.length === 0 || path === req_path_array[0]) {
        // if not serve the root
        // then remove the filtered folder from path
        if (path.length !== 0) {
          req_path_array = req_path_array.slice(1);
        }

        return send(ctx, req_path_array.join('/') || '/', options).then(()=>{
          return next();
        });
      }
    }

    return next();
  };
}

module.exports = serve;
