"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLine = void 0;
var qs = require("qs");
var LogLine = /** @class */ (function () {
    function LogLine(logLine) {
        this.originalLogLine = logLine;
        this.logLine = this.originalLogLine;
        this.opType = this.getOpType();
    }
    LogLine.prototype.getLogLine = function () {
        return this.logLine;
    };
    LogLine.prototype.getOpType = function () {
        if (this.logLine.attr.command.insert != null)
            return "Insert";
        else if (this.logLine.attr.command.find != null)
            return "Find";
        else if (this.logLine.attr.command.update != null)
            return "Update";
        else if (this.logLine.attr.command.getMore != null)
            return "getMore";
        else if (this.logLine.attr.command.aggregate != null)
            return "Aggregate";
        else if (this.logLine.attr.command.count != null)
            return "Count";
        else
            return "";
    };
    LogLine.prototype.isAcceptableNamespace = function () {
        return (this.logLine.attr.ns.split(".")[0] !== "admin"
            && this.logLine.attr.ns.split(".")[0] !== "local"
            && this.logLine.attr.ns.split(".")[0] !== "config"
            && this.logLine.attr.ns.split(".")[1] !== "$cmd"
            && !this.logLine.attr.appName.includes("mongot")
            && this.logLine.attr.command.createIndexes != null);
    };
    LogLine.prototype.process_aggregation = function () {
        var final_data = {
            filter: {},
            sort: "",
            blocking: "No",
            lookup: "No"
        };
        if (this.opType == "Aggregate")
            return final_data;
        var pipeline = this.logLine.attr.command.pipeline;
        for (var i = 0; i < pipeline.length; i++) {
            var stage = "";
            for (var key in pipeline[i]) {
                stage = key;
                break;
            }
            if (stage === "$match") {
                // final_data.filter = final_data.filter + " " + JSON.stringify(pipeline[i]["$match"]);
                final_data.filter = pipeline[i]["$match"];
            }
            if (stage === "$sort") {
                final_data.sort = final_data.sort + " " + JSON.stringify(pipeline[i]["$sort"]);
            }
            if (stage === "$lookup") {
                final_data.lookup = "Yes";
            }
            if (stage === "$group" || stage === "$bucket" || stage === "$bucketAuto") {
                final_data.blocking = "Yes";
            }
        }
        if (final_data.sort === "")
            final_data.sort = "N.A.";
        if (final_data.filter === "")
            final_data.sort = JSON.stringify({});
        return final_data;
    };
    ;
    LogLine.prototype.redact_v2 = function (filter) {
        var topLevelTokens = qs.stringify(filter).split("&");
        return JSON.stringify(qs.parse(topLevelTokens.map(function (tk) {
            var _a = tk.split("="), pre = _a[0], val = _a[1];
            return [pre, "1"].join("=");
        }).join("&")));
    };
    return LogLine;
}());
exports.LogLine = LogLine;
