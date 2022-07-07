const fs = require("fs");
exports.generate_html = (data, page_size = 50,summary) => {
    const columns = [];
    for (let name in data[0]) {
        columns.push(name);
    }

    let html = `<html>
            <head>
                <title>Log Analysis</title>
                <!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.datatables.net/1.12.1/css/jquery.dataTables.min.css">
<script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=" crossorigin="anonymous"></script>
<!-- Latest compiled and minified JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@3.3.7/dist/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
<script src="https://cdn.datatables.net/1.12.1/js/jquery.dataTables.min.js"></script>
            <style>
            td { 
    overflow: hidden; 
    text-overflow: ellipsis; 
    word-wrap: break-word;
}
table { 
    table-layout:fixed;
}
</style>
            </head>
            <body class="container-fluid">
            <table id="summary" class="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Number of COLLSCAN</td>
                        <td>${summary.nCOLLSCAN}</td>
                    </tr>
                    <tr>
                        <td>Number of Slow Ops</td>
                        <td>${summary.nSlowOps}</td>
                    </tr>
                    <tr>
                        <td>Number of Inserts</td>
                        <td>${summary.nInsert}</td>
                    </tr>
                    <tr>
                        <td>Number of Updates</td>
                        <td>${summary.nUpdate}</td>
                    </tr>
                    <tr>
                        <td>Number of Get More</td>
                        <td>${summary.nGetMore}</td>
                    </tr>
                    <tr>
                        <td>Number of Aggregate</td>
                        <td>${summary.nAggregate}</td>
                    </tr>
                    <tr>
                        <td>Number of Find</td>
                        <td>${summary.nFind}</td>
                    </tr>
                    <tr>
                        <td>Number of Count</td>
                        <td>${summary.nCount}</td>
                    </tr>
                    <tr>
                        <td>Slowest Operation Duration(in Millis)</td>
                        <td>${summary.slowestOp}</td>
                    </tr>
                    <tr>
                        <td>slowestQuery</td>
                        <td>${summary.slowestQuery}</td>
                    </tr>
                    
                </tbody>
            </table>  

            <table id="example" data-page-length='${page_size}' class="table table-striped table-bordered"><thead><tr>`;

    for (let item of columns) {
        html += '<th>' + item + '</th>';
    }

    html += '</tr></thead><tbody>';

    let itr = 0;
    for (let item of data) {
        html += '<tr>';
        for (let name of columns) {
            if (name === "Log") {
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
    html += `</tbody></table> <script>$(document).ready(function () {
            $('#example').DataTable();});</script>`;
    html += '</body></html>';
    fs.writeFileSync(process.cwd() + "/" + new Date().getTime().toString() + '.html', html);
}