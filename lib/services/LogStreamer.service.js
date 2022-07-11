"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogStreamer = void 0;
var LogLine_class_1 = require("../classes/LogLine.class");
var common_functions_1 = require("../utility/common.functions");
var RenderHTML_service_1 = require("./RenderHTML.service");
var fs = require('fs');
var es = require('event-stream');
var LogStreamer = /** @class */ (function () {
    function LogStreamer(logFilePath, isGrouped, limit, uiPageSize, slowMs) {
        this.logFile = logFilePath;
        this.isGrouped = isGrouped;
        this.limit = limit;
        this.uiPageSize = uiPageSize;
        this.slowMs = slowMs;
        this.logList = [];
    }
    LogStreamer.prototype.stream = function () {
        var _this = this;
        var parsed_log_summary = {
            nCOLLSCAN: 0,
            nSlowOps: 0,
            nFind: 0,
            nGetMore: 0,
            nAggregate: 0,
            nInsert: 0,
            nUpdate: 0,
            slowestOp: 0,
            nCount: 0,
            slowestQuery: ""
        };
        var slowMs = this.slowMs;
        var stream = fs.createReadStream(this.logFile)
            .pipe(es.split())
            .pipe(es.mapSync(function (log) {
            stream.pause();
            if (log) {
                var logObject = new LogLine_class_1.LogLine(JSON.parse(log));
                var logLine = logObject.getLogLine();
                // process log here and call s.resume() when ready
                if (logLine != null) {
                    // Only parse commands for the scope
                    // Filter out the commands with undefined attr and ns
                    if (logLine.c === "COMMAND"
                        && typeof (logLine.attr) != 'undefined'
                        && typeof (logLine.attr.ns) != 'undefined') {
                        // Set default appName
                        if (!logLine.attr.appName)
                            logLine.attr.appName = "";
                        // Filter Out System Commands
                        if (logObject.isAcceptableNamespace()) {
                            // Detect OpType
                            // Current list of supported opTypes include Insert, Find, Update,
                            // getMore, Aggregate & Count
                            var opType = logObject.getOpType();
                            // Filter Query Details
                            var parsedLogLine = {
                                OpType: opType,
                                Duration: logLine.attr.durationMillis,
                                QTR: null,
                                Namespace: logLine.attr.ns,
                                Filter: {},
                                Sort: "No Sort",
                                Lookup: "N.A.",
                                Blocking: "N.A.",
                                "Plan Summary": "N.A.",
                                "App Name": logLine.attr.appName.slice(0, 25) + '...',
                                QueryHash: logLine.attr.queryHash,
                                Log: JSON.stringify(logLine)
                            };
                            if (parsedLogLine.Duration >= slowMs) {
                                parsed_log_summary.nSlowOps++;
                            }
                            if (opType === "Find") {
                                parsedLogLine.Filter = logLine.attr.command.filter || "-";
                                parsedLogLine.Sort = (logLine.attr.command.sort) ? JSON.stringify(logLine.attr.command.sort) : "No Sort";
                                parsedLogLine["Plan Summary"] = logLine.attr.planSummary;
                                if (parsedLogLine["Plan Summary"] === "COLLSCAN")
                                    parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nFind++;
                                parsedLogLine.QTR = logLine.attr.docsExamined / logLine.attr.nreturned;
                                // if (parsedLogLine.QTR === "Infinity") parsedLogLine.QTR = "No Document Returned";
                                parsedLogLine.QTR = Math.round(parsedLogLine.QTR * 100) / 100;
                            }
                            if (opType === "Count") {
                                parsedLogLine.Filter = logLine.attr.command.query || "-";
                                parsedLogLine["Plan Summary"] = logLine.attr.planSummary;
                                if (parsedLogLine["Plan Summary"] === "COLLSCAN")
                                    parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nCount++;
                                parsedLogLine.QTR = logLine.attr.docsExamined;
                            }
                            if (opType === "Aggregate") {
                                var aggregation = logObject.process_aggregation();
                                parsedLogLine.Filter = aggregation.filter;
                                parsedLogLine.Sort = aggregation.sort;
                                parsedLogLine.Blocking = aggregation.blocking;
                                parsedLogLine.Lookup = aggregation.lookup;
                                parsedLogLine["Plan Summary"] = logLine.attr.planSummary;
                                if (parsedLogLine["Plan Summary"] === "COLLSCAN")
                                    parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nAggregate++;
                                parsedLogLine.QTR = logLine.attr.docsExamined / logLine.attr.nreturned;
                                // if (parsedLogLine.QTR === "Infinity") parsedLogLine.QTR = "Check Log";
                                parsedLogLine.QTR = Math.round(parsedLogLine.QTR);
                            }
                            if (opType === "getMore") {
                                // @ts-ignore
                                if (typeof (logLine.attr.originatingCommand.pipeline) != "undefined") {
                                    var aggregation = logObject.process_aggregation();
                                    parsedLogLine.Filter = aggregation.filter;
                                    parsedLogLine.Sort = aggregation.sort;
                                    parsedLogLine.Blocking = aggregation.blocking;
                                    parsedLogLine.Lookup = aggregation.lookup;
                                }
                                else {
                                    // @ts-ignore
                                    parsedLogLine.Filter = logLine.attr.originatingCommand.filter;
                                    // @ts-ignore
                                    parsedLogLine.Sort = (logLine.attr.originatingCommand.sort) ? JSON.stringify(logLine.attr.originatingCommand.sort) : "No Sort";
                                }
                                parsedLogLine["Plan Summary"] = logLine.attr.planSummary;
                                if (parsedLogLine["Plan Summary"] === "COLLSCAN")
                                    parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nGetMore++;
                            }
                            if (opType === "Update") {
                                // Bypass UpdateMany Logs As they do not contain much information
                                // @ts-ignore
                                if (typeof (logLine.attr.command.updates[0]) != 'undefined')
                                    // @ts-ignore
                                    parsedLogLine.Filter = logLine.attr.command.updates[0].q;
                                if (parsedLogLine["Plan Summary"] === "COLLSCAN")
                                    parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nUpdate++;
                            }
                            if (opType === "Insert") {
                                parsed_log_summary.nInsert++;
                            }
                            if (parsedLogLine.Duration > parsed_log_summary.slowestOp) {
                                parsed_log_summary.slowestOp = parsedLogLine.Duration;
                                parsed_log_summary.slowestQuery = JSON.stringify(parsedLogLine.Filter);
                            }
                            // Push To Final Parsed Log Array
                            _this.logList.push(parsedLogLine);
                        }
                    }
                }
            }
            // resume the read stream, possibly from a callback
            stream.resume();
        })
            .on('error', function (err) {
            console.log('Error while reading file.', err);
        })
            .on('end', function () {
            if (_this.isGrouped) {
                var parsed = (0, common_functions_1.sort_by_key)(_this.logList, "Filter");
                var grouped_logs = [];
                var groupedLogLineData = {
                    "Count": 0,
                    "AvgTime": 0,
                    "OpType": "",
                    "Filter": "",
                    "AvgQTR": 0,
                    "Namespace": "",
                    "Sort": "",
                    "Most Degraded Plan": "",
                    "Redacted": ""
                };
                var is_collscan = false;
                for (var i = 0; i < _this.logList.length; i++) {
                    if (i !== (_this.logList.length - 1)) {
                        if (_this.logList[i].QueryHash === _this.logList[i + 1].QueryHash) {
                            groupedLogLineData.Count++;
                            groupedLogLineData.Filter = (0, common_functions_1.redact_v2)(_this.logList[i].Filter);
                            groupedLogLineData.OpType = _this.logList[i]["OpType"];
                            groupedLogLineData.AvgTime = Math.round((groupedLogLineData.AvgTime + _this.logList[i]["Duration"]) / groupedLogLineData.Count);
                            groupedLogLineData.AvgQTR = Math.round((groupedLogLineData.AvgQTR + (_this.logList[i]["QTR"] || 0)) / groupedLogLineData.Count);
                            groupedLogLineData.Namespace = _this.logList[i]["Namespace"];
                            groupedLogLineData.Sort = _this.logList[i].Sort;
                            groupedLogLineData["Most Degraded Plan"] = _this.logList[i]["Plan Summary"];
                            if (groupedLogLineData["Most Degraded Plan"] === "COLLSCAN")
                                is_collscan = true;
                        }
                        else {
                            groupedLogLineData.Count++;
                            grouped_logs.push(groupedLogLineData);
                            if (is_collscan)
                                groupedLogLineData["Most Degraded Plan"] = "COLLSCAN";
                            if (isNaN(groupedLogLineData.AvgQTR))
                                groupedLogLineData.AvgQTR = -1;
                            groupedLogLineData = {
                                "Count": 0,
                                "AvgTime": 0,
                                "OpType": "",
                                "Filter": "",
                                "AvgQTR": 0,
                                "Namespace": "",
                                "Sort": "",
                                "Most Degraded Plan": "",
                                "Redacted": ""
                            };
                        }
                    }
                }
                _this.htmlGenerator = new RenderHTML_service_1.RenderHTML((0, common_functions_1.sort_by_key)(grouped_logs, "AvgTime")
                    .splice(0, _this.limit));
                _this.htmlGenerator.renderLogParserData(_this.uiPageSize, parsed_log_summary);
            }
            else {
                for (var itr = 0; itr < _this.logList.length; itr++) {
                    _this.logList[itr].Filter = JSON.stringify(_this.logList[itr].Filter);
                }
                _this.htmlGenerator = new RenderHTML_service_1.RenderHTML((0, common_functions_1.sort_by_key)(_this.logList, "Duration")
                    .splice(0, _this.limit));
                _this.htmlGenerator.renderLogParserData(_this.uiPageSize, parsed_log_summary);
            }
            console.log('Analysis Done.');
        }));
    };
    return LogStreamer;
}());
exports.LogStreamer = LogStreamer;
//# sourceMappingURL=LogStreamer.service.js.map