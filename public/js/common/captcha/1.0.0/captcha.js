/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-6-25
 * Time: 下午3:38
 * To change this template use File | Settings | File Templates.
 */
var $ = require('jquery'),
  Uri = require('jsuri');

function Captcha(captcha, key){
  if (!(this instanceof Captcha))
    return new Captcha(captcha);

  this.captcha = $(captcha);
  this.key = typeof key === 'string' ? key : '_';
  this.src = this.captcha.attr('src');
  this.initialize();
}

Captcha.prototype = {
  initialize: function (){
    var that = this;
    this.captcha.on('click.captcha', function (){
      that.update();
    }).css('cursor', 'pointer');
  },
  update: function (){
    var src = new Uri(this.src)
      .replaceQueryParam(this.key, Date.now())
      .toString();

    this.captcha.attr('src', src);
  }
};

module.exports = Captcha;
