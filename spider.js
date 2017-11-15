/**
 * Created by nuintun on 2016/10/9.
 */

'use strict';

const request = require('superagent');

var urls = [
  '',
  '/about',
  '/about/advantage',
  '/about/aptitude',
  '/about/culture',
  '/about/history',
  '/business',
  '/business/insurance',
  '/business/outsource',
  '/business/proxy',
  '/business/temporary',
  '/contact',
  '/contact/comment',
  '/contact/school',
  '/contact/society',
  '/cooperation',
  '/custom',
  '/jobs',
  '/news',
  '/news/help',
  '/news/policy',
  '/news/trade',
].map(function(value) {
  return 'http://gxt.herokuapp.com' + value;
});

urls = urls.join('\n');

request
  .post('http://data.zz.baidu.com/urls?site=gxt.herokuapp.com')
  .send(urls)
  .set('Content-Type', 'text/plain')
  .set('Content-Length', new Buffer(urls).length)
  .end(function(err, res) {
    if (err) {
      throw err;
    }

    var data = res.body;

    if (data.error) {
      console.log(data.message);
    } else {
      console.log(`不合法的url列表： ${data.not_valid || 0}`);
      console.log(`成功推送的url条数： ${data.success || 0}`);
      console.log(`当天剩余的可推送url条数： ${data.remain || 0}`);
      console.log(`由于不是本站url而未处理的url列表： ${data.not_same_site.join(', ') || 0}`);
    }
  });
