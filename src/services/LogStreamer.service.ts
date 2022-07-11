import { LogLine } from "../classes/LogLine.class";
import { BaseObject } from "../models/LogLine.model";
import { ParsedLog, ParsedLogGrouped } from "../models/ParsedLog.model";
import { redact_v2, sort_by_key } from "../utility/common.functions";
import { RenderHTML } from "./RenderHTML.service";


const fs = require('fs');
const es = require('event-stream');


export class LogStreamer {

    private logList: Array<ParsedLog>;
    private logFile: string;
    private isGrouped: boolean;
    private limit: number;
    private uiPageSize: number;
    private slowMs: number;
    private htmlGenerator?: RenderHTML;

    constructor(logFilePath: string, isGrouped: boolean, limit: number,
        uiPageSize: number, slowMs: number) {
        this.logFile = logFilePath;
        this.isGrouped = isGrouped;
        this.limit = limit;
        this.uiPageSize = uiPageSize;
        this.slowMs = slowMs;
        this.logList = [];
    }

    stream(): void {
        let parsed_log_summary = {
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
        }

        let slowMs = this.slowMs;

        let stream = fs.createReadStream(this.logFile)
            .pipe(es.split())
            .pipe(es.mapSync((log: string) => {
                console.log(log);
                // pause the log stream to process the line
                stream.pause();
                if (log != null) {
                    let logObject = new LogLine(JSON.parse(log));
                    let logLine = logObject.getLogLine();
                    // process log here and call s.resume() when ready
                    if (logLine != null) {
                        // Only parse commands for the scope
                        // Filter out the commands with undefined attr and ns
                        if (logLine.c === "COMMAND"
                            && typeof (logLine.attr) != 'undefined'
                            && typeof (logLine.attr.ns) != 'undefined') {

                            // Set default appName
                            if (!logLine.attr.appName) logLine.attr.appName = "";

                            // Filter Out System Commands
                            if (logObject.isAcceptableNamespace()) {

                                // Detect OpType
                                // Current list of supported opTypes include Insert, Find, Update,
                                // getMore, Aggregate & Count
                                let opType = logObject.getOpType();

                                // Filter Query Details
                                let parsedLogLine: ParsedLog = {
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
                                }
                                if (parsedLogLine.Duration >= slowMs) {
                                    parsed_log_summary.nSlowOps++;
                                }

                                if (opType === "Find") {
                                    parsedLogLine.Filter = logLine.attr.command.filter || "-";
                                    parsedLogLine.Sort = (logLine.attr.command.sort) ? JSON.stringify(logLine.attr.command.sort) : "No Sort";
                                    parsedLogLine["Plan Summary"] = logLine.attr.planSummary;
                                    if (parsedLogLine["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                    parsed_log_summary.nFind++;
                                    parsedLogLine.QTR = logLine.attr.docsExamined / logLine.attr.nreturned;
                                    // if (parsedLogLine.QTR === "Infinity") parsedLogLine.QTR = "No Document Returned";
                                    parsedLogLine.QTR = Math.round(parsedLogLine.QTR * 100) / 100
                                }
                                if (opType === "Count") {
                                    parsedLogLine.Filter = logLine.attr.command.query || "-";
                                    parsedLogLine["Plan Summary"] = logLine.attr.planSummary;
                                    if (parsedLogLine["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                    parsed_log_summary.nCount++;
                                    parsedLogLine.QTR = logLine.attr.docsExamined;
                                }
                                if (opType === "Aggregate") {
                                    let aggregation = logObject.process_aggregation();
                                    parsedLogLine.Filter = aggregation.filter;
                                    parsedLogLine.Sort = aggregation.sort;
                                    parsedLogLine.Blocking = aggregation.blocking;
                                    parsedLogLine.Lookup = aggregation.lookup;
                                    parsedLogLine["Plan Summary"] = logLine.attr.planSummary;
                                    if (parsedLogLine["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                    parsed_log_summary.nAggregate++;
                                    parsedLogLine.QTR = logLine.attr.docsExamined / logLine.attr.nreturned;
                                    // if (parsedLogLine.QTR === "Infinity") parsedLogLine.QTR = "Check Log";
                                    parsedLogLine.QTR = Math.round(parsedLogLine.QTR)
                                }
                                if (opType === "getMore") {
                                    // @ts-ignore
                                    if (typeof (logLine.attr.originatingCommand.pipeline) != "undefined") {
                                        let aggregation = logObject.process_aggregation();
                                        parsedLogLine.Filter = aggregation.filter;
                                        parsedLogLine.Sort = aggregation.sort;
                                        parsedLogLine.Blocking = aggregation.blocking;
                                        parsedLogLine.Lookup = aggregation.lookup;
                                    } else {
                                        // @ts-ignore
                                        parsedLogLine.Filter = logLine.attr.originatingCommand.filter;
                                        // @ts-ignore
                                        parsedLogLine.Sort = (logLine.attr.originatingCommand.sort) ? JSON.stringify(logLine.attr.originatingCommand.sort) : "No Sort";
                                    }
                                    parsedLogLine["Plan Summary"] = logLine.attr.planSummary;
                                    if (parsedLogLine["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                    parsed_log_summary.nGetMore++;
                                }
                                if (opType === "Update") {
                                    // Bypass UpdateMany Logs As they do not contain much information
                                    // @ts-ignore
                                    if (typeof (logLine.attr.command.updates[0]) != 'undefined')
                                        // @ts-ignore
                                        parsedLogLine.Filter = logLine.attr.command.updates[0].q;

                                    if (parsedLogLine["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
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
                                this.logList.push(parsedLogLine);
                            }
                        }
                    }
                }
                // resume the read stream, possibly from a callback
                stream.resume();
            })
                .on('error', (err: BaseObject) => {
                    console.log('Error while reading file.', err);
                })
                .on('end', () => {
                    if (this.isGrouped) {
                        let parsed = sort_by_key(this.logList, "Filter");
                        let grouped_logs: Array<ParsedLogGrouped> = [];
                        let groupedLogLineData: ParsedLogGrouped = {
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

                        let is_collscan = false;
                        for (let i = 0; i < this.logList.length; i++) {
                            if (i !== (this.logList.length - 1)) {
                                if (this.logList[i].QueryHash === this.logList[i + 1].QueryHash) {
                                    groupedLogLineData.Count++;
                                    groupedLogLineData.Filter = redact_v2(this.logList[i].Filter);
                                    groupedLogLineData.OpType = this.logList[i]["OpType"];
                                    groupedLogLineData.AvgTime = Math.round((groupedLogLineData.AvgTime + this.logList[i]["Duration"]) / groupedLogLineData.Count);
                                    groupedLogLineData.AvgQTR = Math.round((groupedLogLineData.AvgQTR + (this.logList[i]["QTR"] || 0)) / groupedLogLineData.Count);
                                    groupedLogLineData.Namespace = this.logList[i]["Namespace"];
                                    groupedLogLineData.Sort = this.logList[i].Sort;
                                    groupedLogLineData["Most Degraded Plan"] = this.logList[i]["Plan Summary"];
                                    if (groupedLogLineData["Most Degraded Plan"] === "COLLSCAN") is_collscan = true;
                                } else {
                                    groupedLogLineData.Count++;
                                    grouped_logs.push(groupedLogLineData);
                                    if (is_collscan) groupedLogLineData["Most Degraded Plan"] = "COLLSCAN";
                                    if (isNaN(groupedLogLineData.AvgQTR)) groupedLogLineData.AvgQTR = -1;
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
                        this.htmlGenerator = new RenderHTML(sort_by_key(grouped_logs, "AvgTime")
                            .splice(0, this.limit));
                        this.htmlGenerator.renderLogParserData(this.uiPageSize, parsed_log_summary);
                    } else {
                        for (let itr = 0; itr < this.logList.length; itr++) {
                            this.logList[itr].Filter = JSON.stringify(this.logList[itr].Filter);
                        }
                        this.htmlGenerator = new RenderHTML(sort_by_key(this.logList, "Duration")
                            .splice(0, this.limit));
                        this.htmlGenerator.renderLogParserData(this.uiPageSize, parsed_log_summary);
                    }
                    console.log('Analysis Done.')
                })
            );
    }
}