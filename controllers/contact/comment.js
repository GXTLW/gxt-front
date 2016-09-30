/**
 * Created by nuintun on 2016/9/24.
 */

'use strict';

module.exports = {
  index: ctx=>{
    ctx.state.title = '在线留言';

    ctx.body = ctx.render('apps/contact/comment');
  }
};
