const fs = require('fs');
const es = require('event-stream');
const {
    sort_by_key,
    process_aggregation,
    filter_commands,
    parse_optype,
    redact, redact_v2,
    getFileName
} = require('./utility');
const {generate_html} = require('./render_html');

exports.parse = (log_file, is_grouped, limit, page_size, slow_ms) => {
    let parsed_log_list = [];
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
    let baseFileName = getFileName(log_file)
    let stream = fs.createReadStream(log_file)
        .pipe(es.split())
        .pipe(es.mapSync(function (log_line) {

                // pause the log stream to process the line
                stream.pause();

                // process log here and call s.resume() when ready
                if (!(log_line === '' || log_line === null)) {
                    let log = JSON.parse(log_line)
                    // Only parse commands for the scope
                    // Filter out the commands with undefined attr and ns
                    if (log.c === "COMMAND"
                        && typeof (log.attr) != 'undefined'
                        && typeof (log.attr.ns) != 'undefined') {

                        // Set default appName
                        if (!log.attr.appName) log.attr.appName = "";

                        // Filter Out System Commands
                        if (filter_commands(log.attr)) {

                            // Detect OpType
                            // Current list of supported opTypes include Insert, Find, Update,
                            // getMore, Aggregate & Count
                            let opType = parse_optype(log.attr.command);

                            // Filter Query Details
                            let parsed_log = {
                                "Op Type": opType,
                                "Duration": log.attr.durationMillis,
                                "QTR": "-",
                                "Namespace": log.attr.ns,
                                "Filter": {},
                                "Sort": "No Sort",
                                "Lookup": "N.A.",
                                "Blocking": "N.A.",
                                "Plan Summary": "N.A.",
                                "App Name": log.attr.appName.slice(0, 25) + '...',
                                "QueryHash": log.attr.queryHash,
                                "Log": log_line
                            }
                            if (parsed_log.Duration >= slow_ms) {
                                parsed_log_summary.nSlowOps++;
                            }

                            if (opType === "Find") {
                                parsed_log.Filter = log.attr.command.filter;
                                parsed_log.Sort = (log.attr.command.sort) ? JSON.stringify(log.attr.command.sort) : "No Sort";
                                parsed_log["Plan Summary"] = log.attr.planSummary;
                                if (parsed_log["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nFind++;
                                parsed_log.QTR = log.attr.docsExamined / log.attr.nreturned;
                                if (parsed_log.QTR === "Infinity") parsed_log.QTR = "No Document Returned";
                                else parsed_log.QTR = Math.round(parsed_log.QTR * 100) / 100
                            }
                            if (opType === "Count") {
                                parsed_log.Filter = log.attr.command.query;
                                parsed_log["Plan Summary"] = log.attr.planSummary;
                                if (parsed_log["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nCount++;
                                parsed_log.QTR = log.attr.docsExamined;
                            }
                            if (opType === "Aggregate") {
                                let aggregation = process_aggregation(log.attr.command.pipeline);
                                parsed_log.Filter = aggregation.filter;
                                parsed_log.Sort = aggregation.sort;
                                parsed_log.Blocking = aggregation.blocking;
                                parsed_log.Lookup = aggregation.lookup;
                                parsed_log["Plan Summary"] = log.attr.planSummary;
                                if (parsed_log["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nAggregate++;
                                parsed_log.QTR = log.attr.docsExamined / log.attr.nreturned;
                                if (parsed_log.QTR === "Infinity") parsed_log.QTR = "Check Log";
                                else parsed_log.QTR = Math.round(parsed_log.QTR)
                            }
                            if (opType === "getMore") {
                                if (typeof (log.attr.originatingCommand.pipeline) != "undefined") {
                                    let aggregation = process_aggregation(log.attr.originatingCommand.pipeline);
                                    parsed_log.Filter = aggregation.filter;
                                    parsed_log.Sort = aggregation.sort;
                                    parsed_log.Blocking = aggregation.blocking;
                                    parsed_log.Lookup = aggregation.lookup;
                                } else {
                                    parsed_log.Filter = log.attr.originatingCommand.filter;
                                    parsed_log.Sort = (log.attr.originatingCommand.sort) ? JSON.stringify(log.attr.originatingCommand.sort) : "No Sort";
                                }
                                parsed_log["Plan Summary"] = log.attr.planSummary;
                                if (parsed_log["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nGetMore++;
                            }
                            if (opType === "Update") {
                                // Bypass UpdateMany Logs As they do not contain much information
                                if (typeof (log.attr.command.updates[0]) != 'undefined')
                                    parsed_log.Filter = log.attr.command.updates[0].q;

                                if (parsed_log["Plan Summary"] === "COLLSCAN") parsed_log_summary.nCOLLSCAN++;
                                parsed_log_summary.nUpdate++;
                            }
                            if (opType === "Insert") {
                                parsed_log_summary.nInsert++;
                            }

                            if (parsed_log.Duration > parsed_log_summary.slowestOp) {
                                parsed_log_summary.slowestOp = parsed_log.Duration;
                                parsed_log_summary.slowestQuery = JSON.stringify(parsed_log.Filter);
                            }
                            // Push To Final Parsed Log Array
                            parsed_log_list.push(parsed_log);
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
                    if (is_grouped) {
                        parsed_log_list = sort_by_key(parsed_log_list, "Filter");
                        let grouped_logs = [];
                        let obj = {
                            "Count": 0,
                            "AvgTime": 0,
                            "OpType": "",
                            "Filter": "",
                            "AvgQTR": 0,
                            "Namespace": "",
                            "Sort": "",
                            "Most Degraded Plan": "",
                        };
                        for (let itr = 0; itr < parsed_log_list.length; itr++) {
                            try {
                                parsed_log_list[itr].Redacted = redact_v2(parsed_log_list[itr].Filter)
                            } catch (ex) {
                                console.log(parsed_log_list[itr].Filter)
                                console.log(ex)
                            }
                        }

                        let is_collscan = false;
                        for (let i = 0; i < parsed_log_list.length; i++) {
                            if (i !== (parsed_log_list.length - 1)) {
                                if (parsed_log_list[i].QueryHash === parsed_log_list[i + 1].QueryHash) {
                                    obj.Count++;
                                    obj.Filter = parsed_log_list[i].Redacted;
                                    obj.OpType = parsed_log_list[i]["Op Type"];
                                    obj.AvgTime = Math.round((obj.AvgTime + parsed_log_list[i]["Duration"]) / obj.Count);
                                    obj.AvgQTR = Math.round((obj.AvgQTR + parsed_log_list[i]["QTR"]) / obj.Count);
                                    obj.Namespace = parsed_log_list[i]["Namespace"];
                                    obj.Sort = parsed_log_list[i].Sort;
                                    obj["Most Degraded Plan"] = parsed_log_list[i]["Plan Summary"];
                                    if (obj["Most Degraded Plan"] === "COLLSCAN") is_collscan = true;
                                } else {
                                    obj.Count++;
                                    grouped_logs.push(obj);
                                    if (is_collscan) obj["Most Degraded Plan"] = "COLLSCAN";
                                    if (isNaN(obj.AvgQTR)) obj.AvgQTR = "N.A.";
                                    obj = {
                                        "Count": 0,
                                        "AvgTime": 0,
                                        "OpType": "",
                                        "Filter": "",
                                        "AvgQTR": 0,
                                        "Namespace": "",
                                        "Sort": "",
                                        "Most Degraded Plan": "",
                                    };
                                }
                            }
                        }
                        parsed_log_list = sort_by_key(grouped_logs, "AvgTime");

                    } else {
                        for (let itr = 0; itr < parsed_log_list.length; itr++) {
                            parsed_log_list[itr].Filter = JSON.stringify(parsed_log_list[itr].Filter);
                        }
                        parsed_log_list = sort_by_key(parsed_log_list, "Duration");
                    }

                    parsed_log_list = parsed_log_list.splice(0, limit);
                    generate_html(parsed_log_list, page_size, parsed_log_summary,baseFileName);
                    console.log('Analysis Done.')
                })
        );
};