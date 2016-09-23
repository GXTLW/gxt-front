/*!
 * scrollIntoViewIfNeeded
 * Date: 2016/7/15
 * https://github.com/nuintun/beauty-form
 *
 * This is licensed under the MIT License (MIT).
 * For details, see: https://github.com/nuintun/beauty-form/blob/master/LICENSE
 */

'use strict';

module.exports = function (element, centerIfNeeded){
  if (!element) throw new Error('Element is required in scrollIntoViewIfNeeded');

  function withinBounds(value, min, max, extent){
    if (false === centerIfNeeded || max <= value + extent && value <= min + extent) {
      return Math.min(max, Math.max(min, value));
    } else {
      return (min + max) / 2;
    }
  }

  function makeArea(left, top, width, height){
    return {
      left: left,
      top: top,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height,
      translate: function (x, y){
        return makeArea(x + left, y + top, width, height);
      },
      relativeFromTo: function (lhs, rhs){
        var newLeft = left, newTop = top;

        lhs = lhs.offsetParent;
        rhs = rhs.offsetParent;

        if (lhs === rhs) {
          return area;
        }

        for (; lhs; lhs = lhs.offsetParent) {
          newLeft += lhs.offsetLeft + lhs.clientLeft;
          newTop += lhs.offsetTop + lhs.clientTop;
        }

        for (; rhs; rhs = rhs.offsetParent) {
          newLeft -= rhs.offsetLeft + rhs.clientLeft;
          newTop -= rhs.offsetTop + rhs.clientTop;
        }

        return makeArea(newLeft, newTop, width, height);
      }
    };
  }

  var parent;
  var area = makeArea(
    element.offsetLeft, element.offsetTop,
    element.offsetWidth, element.offsetHeight
  );

  while ((parent = element.parentNode) !== document) {
    var clientLeft = parent.offsetLeft + parent.clientLeft;
    var clientTop = parent.offsetTop + parent.clientTop;

    // make area relative to parent's client area.
    area = area.relativeFromTo(element, parent).translate(-clientLeft, -clientTop);

    var scrollLeft = withinBounds(
      parent.scrollLeft,
      area.right - parent.clientWidth, area.left,
      parent.clientWidth
    );

    var scrollTop = withinBounds(
      parent.scrollTop,
      area.bottom - parent.clientHeight, area.top,
      parent.clientHeight
    );

    parent.scrollLeft = scrollLeft;
    parent.scrollTop = scrollTop;

    // determine actual scroll amount by reading back scroll properties.
    area = area.translate(
      clientLeft - parent.scrollLeft,
      clientTop - parent.scrollTop
    );

    // rewrite element
    element = parent;
  }
};
