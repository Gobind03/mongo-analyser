#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ChunkDistribution_1 = require("./services/ChunkDistribution");
var LogStreamer_service_1 = require("./services/LogStreamer.service");
var ShardStatus_service_1 = require("./services/ShardStatus.service");
var chalk = require('chalk');
var clear = require('clear');
var figlet = require('figlet');
var path = require('path');
var hideBin = require('yargs/helpers').hideBin;
// Clear the CLI before execution starts
clear();
// Print branding - because, why not! :) 
console.log(chalk.green(
// figlet.textSync('Mongo Analyser', { horizontalLayout: 'full' })
));
// Add CLI Options and parse process.argv 
var argv = require('yargs/yargs')(hideBin(process.argv))
    .options('group', {
    alias: 'g', describe: 'Group the output by query formats', type: 'boolean', default: false
})
    .options('limit', {
    alias: 'l', describe: 'Limit the number of output rows', type: 'number', default: 100
})
    .options('log-file', {
    alias: 'f', describe: 'Full Log file path to analyse', demandOption: false, type: 'string'
})
    .options('page-size', {
    alias: 'p', describe: 'Page size of HTML table in report', default: 50, type: 'number'
})
    .options('slow-ms', {
    alias: 's', describe: 'Slow MS Threshold for Query Profiling', default: 100, type: 'number'
})
    .options('chunk-distribution', {
    alias: 'cd', describe: 'Chunk distribution', default: true
})
    .options('uri', {
    alias: 'u', describe: 'MongoDB connection uri', type: 'string'
})
    .options('shard-status', {
    alias: 'd', describe: 'Slow MS Threshold for Query Profiling', default: 100, type: 'number'
})
    .help('help').argv;
// logFilePath: string, isGrouped: boolean, limit: number,
// uiPageSize: number, slowMs: number
if (argv.f) {
    var logStreamer = new LogStreamer_service_1.LogStreamer(argv.f, argv.g, argv.l, argv.p, argv.s);
    logStreamer.stream();
}
if (argv.cd) {
    //console.log(argv.cd, argv.uri);
    var chunkDistribution = new ChunkDistribution_1.ChunkDistribution(argv.u);
    chunkDistribution.print();
}
if (argv.d) {
    var shardStatus = new ShardStatus_service_1.ShardStatus();
    shardStatus.getStatus();
}
//# sourceMappingURL=index.js.map