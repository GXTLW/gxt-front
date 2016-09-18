/**
 * Created with JetBrains WebStorm.
 * User: Administrator
 * Date: 13-6-3
 * Time: 下午2:29
 * To change this template use File | Settings | File Templates.
 */
var MINUTE = 1000 * 60;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;
var MONTH = DAY * 30;

module.exports = {
  /**
   * utf8字符串长度，一个中文字符按照两个字节计算
   * @param str
   * @returns {Number}
   */
  utfLength: function (str){
    return str.replace(/[\u4e00-\u9fa5]/mg, 'aa').length;
  },
  /**
   * 格式化时间
   * @param date
   * @param format
   * @returns {XML|string|void}
   */
  dateFormat: function (date, format){
    // 参数错误
    if (!date instanceof Date) {
      throw new TypeError('Param date must be a Date');
    }

    format = format || 'yyyy-MM-dd hh:mm:ss';

    var map = {
      'M': date.getMonth() + 1, // 月份
      'd': date.getDate(), // 日
      'h': date.getHours(), // 小时
      'm': date.getMinutes(), // 分
      's': date.getSeconds(), // 秒
      'q': Math.floor((date.getMonth() + 3) / 3), // 季度
      'S': date.getMilliseconds() // 毫秒
    };

    format = format.replace(/([yMdhmsqS])+/g, function (all, t){
      var v = map[t];

      if (v !== undefined) {
        if (all.length > 1) {
          v = '0' + v;
          v = v.substr(v.length - 2);
        }

        return v;
      } else if (t === 'y') {
        return (date.getFullYear() + '').substr(4 - all.length);
      }

      return all;
    });

    return format;
  },
  /**
   * 计算两个时间的语义化间隔
   * @param start
   * @param end
   * @returns {*}
   */
  dateFrom: function (start, end){
    var from, interval;
    var month, week, day, hour, minute;

    // 参数错误
    if (!start instanceof Date || !end instanceof Date) {
      throw new TypeError('Param start and end must be a Date');
    }

    interval = end - start;

    if (interval < 0) return '刚刚';

    month = interval / MONTH;
    week = interval / (7 * DAY);
    day = interval / DAY;
    hour = interval / HOUR;
    minute = interval / MINUTE;

    if (month >= 1) {
      from = parseInt(month) + '个月前';
    } else if (week >= 1) {
      from = parseInt(week) + '周前';
    } else if (day >= 1) {
      from = parseInt(day) + '天前';
    } else if (hour >= 1) {
      from = parseInt(hour) + '个小时前';
    } else if (minute >= 1) {
      from = parseInt(minute) + '分钟前';
    } else {
      from = '刚刚';
    }

    return from;
  }
};
