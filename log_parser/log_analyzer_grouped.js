const fs = require('fs');
const es = require('event-stream');


function iterate(obj) {

    for (let property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (typeof obj[property] == "object") {
                for (var p_l2 in obj[property]) {
                    obj[property][p_l2] = "[REDACTED]"
                }
            } else {
                obj[property] = "[REDACTED]"
            }
        }
    }
    return JSON.stringify(obj);
}

let sort_by_key = (array, key) => {
    return array.sort(function (a, b) {
        let x = a[key];
        let y = b[key];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
};

let process_aggregation = (pipeline) => {
    let final_data = {
        filter: {},
        sort: "N.A.",
        blocking: "No",
        lookup: "No",
        filter_redacted: "{}"
    };
    for (let i = 0; i < pipeline.length; i++) {
        let stage = "";
        for (let key in pipeline[i]) {
            stage = key;
            break;
        }
        if (stage == "$match") {
            final_data.filter = pipeline[i]["$match"];
            final_data.filter_redacted = iterate(pipeline[i]["$match"]);
        }
        if (stage == "$sort") {
            final_data.sort = JSON.stringify(pipeline[i]["$sort"]);
        }
        if (stage == "$lookup") {
            final_data.lookup = "Yes";
        }
        if (stage == "$group" || stage == "$bucket" || stage == "$bucketAuto") {
            final_data.blocking = "Yes";
        }
    }
    return final_data;
};

let millisToMinutesAndSeconds = (millis) => {
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
};


let output = [];
let s = fs.createReadStream('log1.log')
    .pipe(es.split())
    .pipe(es.mapSync(function (line) {

            // pause the readstream
            s.pause();

            // process line here and call s.resume() when rdy
            // function below was for logging memory usage
            if (!(line == '' || line == null)) {
                let log = JSON.parse(line)
                // Only Parse Commands
                if (log.c == "COMMAND"
                    && typeof (log.attr) != 'undefined'
                    && typeof (log.attr.ns) != 'undefined') {
                    if (!log.attr.appName) log.attr.appName = "";

                    // Filter Out System Commands
                    if (log.attr.ns.split(".")[0] != "admin"
                        && log.attr.ns.split(".")[0] != "local"
                        && log.attr.ns.split(".")[0] != "config"
                        && !log.attr.appName.includes("mongot")
                        && typeof (log.attr.command.createIndexes) == "undefined") {

                        // Detect OpType
                        let opType = null;
                        if (typeof (log.attr.command.insert) != "undefined")
                            opType = "Insert";
                        else if (typeof (log.attr.command.find) != "undefined")
                            opType = "Find";
                        else if (typeof (log.attr.command.update) != "undefined")
                            opType = "Update";
                        else if (typeof (log.attr.command.getMore) != "undefined")
                            opType = "getMore";
                        else if (typeof (log.attr.command.aggregate) != "undefined")
                            opType = "Aggregate";
                        else if (typeof (log.attr.command.count) != "undefined")
                            opType = "Count";

                        // Filter Query Details
                        let filter = "N.A.";
                        let sort = "No Sort";
                        let planSummary = "N.A.";
                        let qtr = "-";
                        let redacted = "";
                        if (opType == "Find") {
                            redacted = iterate(log.attr.command.filter);
                            filter = JSON.stringify(log.attr.command.filter).slice(0, 25) + '...';
                            ;
                            sort = (log.attr.command.sort) ? JSON.stringify(log.attr.command.sort) : "No Sort";
                            planSummary = log.attr.planSummary;
                            qtr = log.attr.docsExamined / log.attr.nreturned;
                            if (qtr == "Infinity") qtr = "Check Log";
                            else qtr = Math.round(qtr * 100) / 100
                        }
                        if (opType == "Count") {
                            redacted = iterate(log.attr.command.query);
                            filter = JSON.stringify(log.attr.command.query).slice(0, 25) + '...';
                            ;
                            // sort = (log.attr.command.sort) ? JSON.stringify(log.attr.command.sort) : "No Sort";
                            planSummary = log.attr.planSummary;
                            qtr = log.attr.docsExamined;
                        }
                        if (opType == "Aggregate") {
                            let aggregation = process_aggregation(log.attr.command.pipeline);
                            filter = aggregation.filter;
                            redacted = aggregation.filter_redacted;
                            sort = aggregation.sort + " || " + "Blocking: " + aggregation.blocking + " || " + "Lookups: " + aggregation.lookup;
                            planSummary = log.attr.planSummary;
                            qtr = log.attr.docsExamined / log.attr.nreturned;
                            if (qtr == "Infinity") qtr = "Check Log";
                            else qtr = Math.round(qtr * 100) / 100
                        }
                        if (opType == "getMore") {
                            if (typeof (log.attr.originatingCommand.pipeline) != "undefined") {
                                let aggregation = process_aggregation(log.attr.originatingCommand.pipeline);
                                filter = aggregation.filter;
                                redacted = aggregation.filter_redacted;
                                sort = aggregation.sort + " || " + "Blocking: " + aggregation.blocking + " || " + "Lookups: " + aggregation.lookup;
                            } else {
                                filter = JSON.stringify(log.attr.originatingCommand.filter).slice(0, 25) + '...';
                                ;
                                sort = (log.attr.originatingCommand.sort) ? JSON.stringify(log.attr.originatingCommand.sort) : "No Sort";
                            }
                            planSummary = log.attr.planSummary;
                        }
                        if (opType == "Update") {
                            // Bypass UpdateMany Logs
                            if (typeof (log.attr.command.updates[0]) != 'undefined') {
                                filter = JSON.stringify(log.attr.command.updates[0].q).slice(0, 25) + '...';
                                redacted = iterate(log.attr.command.updates[0].q);
                            }
                        }

                        // Generate Table
                        output.push({
                            "Op Type": opType,
                            "Duration": log.attr.durationMillis,
                            "QTR": qtr,
                            "Namespace": log.attr.ns,
                            "Filter": filter,
                            "Sort and RAM": sort,
                            "Plan Summary": planSummary,
                            "App Name": log.attr.appName.slice(0, 25) + '...',
                            "Log": line,
                            "Redacted": redacted
                        });
                    }
                }
            }
            // resume the readstream, possibly from a callback
            s.resume();
        })
            .on('error', function (err) {
                console.log('Error while reading file.', err);
            })
            .on('end', function () {
                output = sort_by_key(output, "Redacted")

                let final_x = [];
                let obj = {
                    "Count": 0,
                    "AvgTime": 0,
                    "OpType": "",
                    "Filter": "",
                    "AvgQTR": 0,
                    "Namespace": "",
                    "Sort": "",
                    "Plan Summary": "",
                };
                for (let i = 0; i < output.length; i++) {
                    if (i != (output.length - 1)) {
                        if (output[i].Redacted == output[i + 1].Redacted) {
                            obj.Count++;
                            obj.Filter = output[i].Redacted;
                            obj.OpType = output[i]["Op Type"];
                            obj.AvgTime = Math.round((obj.AvgTime + output[i]["Duration"]) / obj.Count);
                            obj.AvgQTR = Math.round((obj.AvgQTR + output[i]["QTR"]) / obj.Count);
                            obj.Namespace = output[i]["Namespace"];
                            obj.Sort = output[i]["Sort and RAM"];
                            if (i != 0) {

                            }
                            obj["Plan Summary"] = output[i]["Plan Summary"];
                        } else {
                            obj.Count++;
                            obj.Filter = output[i].Redacted;
                            final_x.push(obj);
                            obj = {
                                "Count": 0,
                                "AvgTime": 0,
                                "OpType": "",
                                "Filter": "",
                                "AvgQTR": 0,
                                "Namespace": "",
                                "Sort and RAM": "",
                                "Plan Summary": "",
                            };
                        }
                    } else {
                        console.log("here");
                    }
                }
                console.log(final_x);
                // console.table(output);
                // for (let i = 0; i < output.length; i++) {
                //     output[i].Duration = millisToMinutesAndSeconds(output[i].Duration);
                // }

                final_x = sort_by_key(final_x, "AvgTime")
                const columns = [];
                for (let name in final_x[0]) {
                    // if (!output[0].hasOwnProperty(name)) continue;
                    columns.push(name);
                }

                let html = `<html>
            <head>
                <title>Log Analysis</title>
                <!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
<script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
<!-- Latest compiled and minified JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
            </head>
            <body class="container-fluid">
            <table class="table table-striped table-bordered"><thead><tr>`;

                for (let item of columns) {
                    html += '<th>' + item + '</th>';
                }

                html += '</tr></thead><tbody>';

                let itr = 0;
                for (let item of final_x) {
                    html += '<tr>';
                    for (let name of columns) {
                        if (name == "Log") {
                            html += `<td><button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal${itr}">
  View
</button>
 <div class="modal fade" id = "exampleModal${itr}" tabindex = "-1" role = "dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-lg" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body" style="word-wrap: break-word;">
                                    ${item["Log"]}
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
</div>
</td>`;
                            html += '</tr>';
                        } else {
                            html += '<td>' + item[name] + '</td>';
                        }
                    }
                    itr++;
                }
                html += '</tbody></table>';
                html += '</body></html>';
                fs.writeFileSync(__dirname + "/" + new Date().getTime().toString() + '.html', html);
                console.log('Read entire file.')
            })
    );