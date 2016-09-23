define("common/calendar/1.1.2/css/date.css.js", ["util/import-style/1.0.0/import-style"], function(require, exports, module){
var style = require("util/import-style/1.0.0/import-style");

style.css("/* date */\n.ui-calendar-date {\n  border: none;\n  box-shadow: none;\n  border-collapse: separate;\n  *border-collapse: collapse;\n  border-spacing: 0;\n}\ntable.ui-calendar-date tr {\n  border: none;\n  margin: 0;\n  padding: 0;\n  width: 100%;\n  background: #fff;\n}\n.ui-calendar-date td, .ui-calendar-date th {\n  width: 34px;\n  height: 30px;\n  line-height: 30px;\n  padding: 0;\n  margin: 0;\n  text-align: center;\n  border: none;\n  cursor: pointer;\n}\n.ui-calendar-date .ui-calendar-day-column {\n  background: #868686;\n  color: #cacaca;\n}\n.ui-calendar-date .ui-calendar-day-column th {\n  border-color: #868686;\n  cursor: default;\n}\n.ui-calendar-date .ui-calendar-date-column .ui-calendar-day-0,\n.ui-calendar-date .ui-calendar-date-column .ui-calendar-day-6 {\n  color: #db693d;\n}\n.ui-calendar-date .ui-calendar-date-column td:hover {\n  cursor: pointer;\n  background-color: #ffdeb8;\n}\n.ui-calendar-date .ui-calendar-date-column td.previous-month,\n.ui-calendar-date .ui-calendar-date-column td.next-month {\n  color: #ccc;\n}\n.ui-calendar-date .ui-calendar-date-column td.previous-month:hover,\n.ui-calendar-date .ui-calendar-date-column td.next-month:hover {\n  cursor: default;\n  border-color: #fff;\n}\n.ui-calendar-date .ui-calendar-date-column td.focused-element {\n  color: #fff;\n  background: #f57403;\n}\n.ui-calendar-date .ui-calendar-date-column td.disabled-element {\n  background: #e2e2e2;\n  color: #c3c3c3;\n}\n.ui-calendar-date .ui-calendar-date-column td.disabled-element:hover {\n  border-color: #fff;\n}\n");
});
