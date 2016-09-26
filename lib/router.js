/**
 * Created by nuintun on 2016/9/26.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('./util');
const Router = require('koa-router');
const convert = require('koa-convert');
const routes = Router.prototype.routes;

/**
 * src for router
 * @param src
 * @param router_base
 * @returns {*|string}
 */
function src4router(src, router_base){
  return util.normalize(path.join(router_base, src));
}

/**
 * src for controller
 * @param src
 * @param router_base
 * @param controller_base
 * @returns {*|string}
 */
function src4controller(src, router_base, controller_base){
  return util.normalize(path.join(controller_base, path.relative(router_base, src)))
}

/**
 * AutoRouter
 * @param router_base
 * @param controller_base
 * @param options
 * @returns {Router}
 * @constructor
 */
function AutoRouter(router_base, controller_base, options){
  var ctx = this;

  if (!(ctx instanceof AutoRouter)) {
    return new AutoRouter(router_base, controller_base, options);
  }

  if (!router_base || !util.string(router_base)) {
    router_base = 'routers';
  }

  if (!controller_base || !util.string(controller_base)) {
    controller_base = 'controllers';
  }

  // super
  Router.call(ctx, options);

  // set prop
  ctx.router_base = router_base;
  ctx.controller_base = controller_base;
}

/**
 * extend
 * @type {Router}
 */
AutoRouter.prototype = Object.create(Router.prototype, {
  constructor: { value: AutoRouter }
});

/**
 * fetch
 * @param dir
 * @returns {Router}
 */
AutoRouter.prototype.fetch = function (dir){
  var ctx = this;

  fs
    .readdirSync(dir)
    .forEach(function (filename){
      var src = src4router(filename, dir);
      var stats = fs.statSync(src);

      // dir
      if (stats.isDirectory()) {
        ctx.fetch(src);
      } else {
        var ext = path
          .extname(src)
          .toLowerCase();

        if (ext === '.js') {
          var routes = util.require(src);
          var controller_src = src4controller(src, ctx.router_base, ctx.controller_base);

          // assert routes
          if (util.object(routes)) {
            // load controller
            try {
              var controller = util.require(controller_src);
            } catch (e) {
              throw new Error(`Controller: ${controller_src} not found!`)
            }

            // assert controller
            if (util.object(controller)) {
              Object.keys(routes).forEach(function (url){
                var route = routes[url];

                // assert route
                if (util.array(route)) {
                  route.forEach(function (item){
                    var action_name = item.action;
                    var action = controller[action_name];

                    // assert action
                    if (action) {
                      var method = route.method || 'get';

                      if (ctx[method]) {
                        ctx[method](url, convert(action));
                      } else {
                        throw new Error(`Method: ${method} not support!`);
                      }
                    } else {
                      throw new Error(`Action: ${action_name} can't be found in controller: ${controller_src}!`);
                    }
                  });
                } else {
                  throw new TypeError(`Route: ${url} invalid!`)
                }
              });
            } else {
              throw new TypeError(`Controller: ${controller_src} invalid!`)
            }
          } else {
            throw new TypeError(`Router: ${src} invalid!`);
          }
        }
      }
    });

  return ctx;
};

/**
 * routes
 * @returns {routes}
 */
AutoRouter.prototype.routes = function (){
  var ctx = this;

  ctx.fetch(ctx.router_base);

  return routes.apply(ctx, arguments);
};

// exports
module.exports = AutoRouter;
