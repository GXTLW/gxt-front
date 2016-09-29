/**
 * Created by nuintun on 2016/9/18.
 */

'use strict';

const nunjucks = require('nunjucks');

nunjucks.configure('views', {
  watch: true
});

module.exports = {
  index: ctx=>{
    ctx.render();
    console.log('bbbb');
    ctx.model.layout = 'layout/default.html';
    ctx.body = nunjucks.render('apps/index/index.html', ctx.model);
  }
};
