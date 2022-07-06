const {hideBin} = require('yargs/helpers')

const argv = require('yargs/yargs')(hideBin(process.argv))
    .options('grouped', {
        alias: 'g', describe: 'Group the output by query formats', type: 'boolean', default: false
    })
    .options('limit', {
        alias: 'l', describe: 'Limit the number of output rows', type: 'number', default: 100
    })
    .options('sort-by-qtr', {
        describe: 'Sort the output by QTR', type: 'boolean',
    })
    .options('sort-by-duration', {
        describe: 'Sort the output by Execution Time', type: 'boolean',
    })
    .options('log-file', {
        alias: 'f', describe: 'Full Log file path to analyse', demandOption: true, type: 'string'
    })
    .help('help').argv

const {parse} = require('./log_parser/parse_logs');
parse(argv.logFile, argv.grouped, argv.limit, argv.sortByQtr, argv.sortByDuration);