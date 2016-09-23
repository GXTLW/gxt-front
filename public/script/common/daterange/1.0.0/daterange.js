define("common/daterange/1.0.0/daterange", ["base/jquery/1.12.4/jquery","util/util/1.0.0/util","common/calendar/1.1.2/calendar"], function(require, exports, module){
/**
 * Created by Newton on 13-10-25.
 */

'use strict';

var $ = require('base/jquery/1.12.4/jquery');
var util = require('util/util/1.0.0/util');
var Calendar = require('common/calendar/1.1.2/calendar');
var today = util.dateFormat(new Date(), 'yyyy-MM-dd');

function dateRange(start, end, startRange, endRange){
  start = $(start);
  end = $(end);

  var startValue = start.val().trim();
  var endValue = end.val().trim();

  startRange = Array.isArray(startRange) ? startRange : [startRange || startRange === null ? startRange : null, today];
  endRange = Array.isArray(endRange) ? endRange : [startValue || null, endRange || endRange === null ? endRange : today];

  var startTime = new Date(startValue || today);
  var endTime = new Date(endValue || today);

  startTime = util.dateFormat(startTime, 'yyyy-MM-dd');
  endTime = util.dateFormat(endTime, 'yyyy-MM-dd');
  startTime = startTime > today ? today : startTime;
  endTime = endTime < today ? today : endTime;

  if (startRange[0] && startTime < startRange[0]) {
    startRange[0] = startTime;
  }

  // 格式化日期范围
  startRange[1] = endValue
    ? endTime > endValue ? endValue : endTime
    : startRange[1];
  endRange[0] = startValue ? startTime : endRange[0];

  start = new Calendar({
    trigger: start,
    range: startRange
  });

  end = new Calendar({
    trigger: end,
    range: endRange
  });

  // 查询开始日期
  start.on('selectDate', function (date){
    end.range([date, endRange[1]]);
  });

  // 查询结束日期
  end.on('selectDate', function (date){
    start.range([startRange[0], date]);
  });

  return {
    start: start,
    end: end
  }
}

dateRange.today = today;

module.exports = dateRange;

});
