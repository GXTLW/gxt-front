/*!
 * util
 * Date: 2016/6/14
 * https://github.com/nuintun/beauty-form
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/beauty-form/blob/master/LICENSE
 */

'use strict';

module.exports = {
  // 获取当前焦点的元素
  activeElement: function() {
    try {
      // try: ie8~9, iframe #26
      var activeElement = document.activeElement;
      var contentDocument = activeElement.contentDocument;

      return contentDocument && contentDocument.activeElement || activeElement;
    } catch (e) {
      // do nothing
    }
  }
};
