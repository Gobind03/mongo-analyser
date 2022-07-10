"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderHTML = void 0;
var fs = require("fs");
var RenderHTML = /** @class */ (function () {
    function RenderHTML(parsedLog) {
        this.logList = parsedLog;
    }
    RenderHTML.prototype.renderLogParserData = function (page_size, summary) {
        if (page_size === void 0) { page_size = 50; }
        var columns = [];
        for (var name_1 in this.logList[0]) {
            columns.push(name_1);
        }
        var html = "<html>\n            <head>\n                <title>Log Analysis</title>\n                <!-- Latest compiled and minified CSS -->\n<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css\" integrity=\"sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u\" crossorigin=\"anonymous\">\n<link rel=\"stylesheet\" href=\"https://cdn.datatables.net/1.12.1/css/jquery.dataTables.min.css\">\n<script src=\"https://code.jquery.com/jquery-3.6.0.min.js\" integrity=\"sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=\" crossorigin=\"anonymous\"></script>\n<!-- Latest compiled and minified JavaScript -->\n<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js\" integrity=\"sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa\" crossorigin=\"anonymous\"></script>\n<script src=\"https://cdn.datatables.net/1.12.1/js/jquery.dataTables.min.js\"></script>\n            <style>\n            td { \n    overflow: hidden; \n    text-overflow: ellipsis; \n    word-wrap: break-word;\n}\ntable { \n    table-layout:fixed;\n}\n</style>\n            </head>\n            <body class=\"container-fluid\">\n            <table id=\"summary\" class=\"table table-striped table-bordered\">\n                <thead>\n                    <tr>\n                        <th>Property</th>\n                        <th>Value</th>\n                    </tr>\n                </thead>\n                <tbody>\n                    <tr>\n                        <td>Number of COLLSCAN</td>\n                        <td>".concat(summary.nCOLLSCAN, "</td>\n                    </tr>\n                    <tr>\n                        <td>Number of Slow Ops</td>\n                        <td>").concat(summary.nSlowOps, "</td>\n                    </tr>\n                    <tr>\n                        <td>Number of Inserts</td>\n                        <td>").concat(summary.nInsert, "</td>\n                    </tr>\n                    <tr>\n                        <td>Number of Updates</td>\n                        <td>").concat(summary.nUpdate, "</td>\n                    </tr>\n                    <tr>\n                        <td>Number of Get More</td>\n                        <td>").concat(summary.nGetMore, "</td>\n                    </tr>\n                    <tr>\n                        <td>Number of Aggregate</td>\n                        <td>").concat(summary.nAggregate, "</td>\n                    </tr>\n                    <tr>\n                        <td>Number of Find</td>\n                        <td>").concat(summary.nFind, "</td>\n                    </tr>\n                    <tr>\n                        <td>Number of Count</td>\n                        <td>").concat(summary.nCount, "</td>\n                    </tr>\n                    <tr>\n                        <td>Slowest Operation Duration(in Millis)</td>\n                        <td>").concat(summary.slowestOp, "</td>\n                    </tr>\n                    <tr>\n                        <td>slowestQuery</td>\n                        <td>").concat(summary.slowestQuery, "</td>\n                    </tr>\n                    \n                </tbody>\n            </table>  \n\n            <table id=\"example\" data-page-length='").concat(page_size, "' class=\"table table-striped table-bordered\"><thead><tr>");
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var item = columns_1[_i];
            html += '<th>' + item + '</th>';
        }
        html += '</tr></thead><tbody>';
        var itr = 0;
        for (var _a = 0, _b = this.logList; _a < _b.length; _a++) {
            var item = _b[_a];
            html += '<tr>';
            for (var _c = 0, columns_2 = columns; _c < columns_2.length; _c++) {
                var name_2 = columns_2[_c];
                if (name_2 === "Log") {
                    html += "<td><button type=\"button\" class=\"btn btn-primary\" data-toggle=\"modal\" data-target=\"#exampleModal".concat(itr, "\">\n  View\n</button>\n <div class=\"modal fade\" id = \"exampleModal").concat(itr, "\" tabindex = \"-1\" role = \"dialog\" aria-labelledby=\"exampleModalLabel\" aria-hidden=\"true\">\n                        <div class=\"modal-dialog modal-lg\" role=\"document\">\n                            <div class=\"modal-content\">\n                                <div class=\"modal-header\">\n                                    <h5 class=\"modal-title\" id=\"exampleModalLabel\">Modal title</h5>\n                                    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n                                        <span aria-hidden=\"true\">&times;</span>\n                                    </button>\n                                </div>\n                                <div class=\"modal-body\" style=\"word-wrap: break-word;\">\n                                    ").concat(
                    // @ts-ignore
                    item["Log"], "\n                                </div>\n                                <div class=\"modal-footer\">\n                                    <button type=\"button\" class=\"btn btn-secondary\" data-dismiss=\"modal\">Close</button>\n                                </div>\n                            </div>\n                        </div>\n</div>\n</td>");
                    html += '</tr>';
                }
                else {
                    // @ts-ignore
                    html += '<td>' + item[name_2] + '</td>';
                }
            }
            itr++;
        }
        html += "</tbody></table> <script>$(document).ready(function () {\n            $('#example').DataTable();});</script>";
        html += '</body></html>';
        fs.writeFileSync(process.cwd() + "/" + new Date().getTime().toString() + '.html', html);
    };
    return RenderHTML;
}());
exports.RenderHTML = RenderHTML;
