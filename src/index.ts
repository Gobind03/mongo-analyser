#!/usr/bin/env node

import { LogStreamer } from "./services/LogStreamer.service";
import { WriteWorkload } from "./services/WriteWorkload.service";
import { IndexStats } from "./services/IndexStats.service";
import { SampleSchema } from "./services/SampleSchema.service";

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const path = require('path');
const { hideBin } = require('yargs/helpers');


// Clear the CLI before execution starts
clear();

// Print branding - because, why not! :) 
console.log(
    chalk.green(
        // figlet.textSync('Mongo Analyser', { horizontalLayout: 'full' })
    )
);


// Add CLI Options and parse process.argv 
const argv = require('yargs/yargs')(hideBin(process.argv))
    .options('group', {
        alias: 'g', describe: 'Group the output by query formats', type: 'boolean', default: false
    })
    .options('limit', {
        alias: 'l', describe: 'Limit the number of output rows', type: 'number', default: 100
    })
    .options('log-file', {
        alias: 'f', describe: 'Full Log file path to analyse', type: 'string'
    })
    .options('page-size', {
        alias: 'p', describe: 'Page size of HTML table in report', default: 50, type: 'number'
    })
    .options('slow-ms', {
        alias: 's', describe: 'Slow MS Threshold for Query Profiling', default: 100, type: 'number'
    })
    .options('index', {
        alias: 'i', describe: 'Get Index Related Data', default: false, type: 'string'
    })
    .options('allInfo', {
        alias: 'ai', describe: 'Get Index Related Data', default: false, type: 'string'
    })
    .options('schema', {
        alias: 's', describe: 'Get Index Related Data', default: false, type: 'string'
    })
    .options('write-workload', {
        alias: 'w', describe: 'Get Write Workload Information', default: false, type: 'string'
    })
    .options('index-stats-on-all-nodes', {
        alias: 'abc', describe: 'Get index stats on all nodes', default: false, type: 'string'
    })
    .options('username', {
        alias: 'u', describe: 'Provide username for cluster', default: false, type: 'string'
    })
    .options('password', {
        alias: 'p', describe: 'Provide password for cluster', default: false, type: 'string'
    })
    .help('help').argv

// logFilePath: string, isGrouped: boolean, limit: number,
// uiPageSize: number, slowMs: number

if (argv.f && argv.f !== "") {
    const logStreamer = new LogStreamer(argv.f, argv.g, argv.l, argv.p, argv.s);
    logStreamer.stream();
} else if (argv.w) {
    const workloadInfo = new WriteWorkload(argv.w);
    workloadInfo.getWriteWorkloadInfo()
} else if (argv.i) {
    if (argv.u === "" && argv.p === "") {
        console.log("Please provide username and password")
    } else {
        let indexStatsService = new IndexStats(argv.i, argv.u, argv.p);
        indexStatsService.getAllIndexStats();
    }
} else if (argv.a) {

} else if (argv.s) {
    let schema = new SampleSchema(argv.s);
    schema.getSchemaSet();
} else {
    console.log("Please use --help for options");
}