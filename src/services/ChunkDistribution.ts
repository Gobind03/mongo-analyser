import { MongoDBAdapter } from "../adapters/mongodb.adapter";
import { LocalDBAdapter } from "../adapters/nedb.adapter";
const moment = require('moment');

export class ChunkDistribution {
    private uri: string;
    private adapter;
    private shardStatusDB2;

    constructor(uri: string) {
        this.uri = uri;
        this.adapter = new MongoDBAdapter();
        this.shardStatusDB2 = new LocalDBAdapter("shardstatus2")
    }

    async print() {
        await this.adapter.connect(this.uri, 'config');
        //console.log(this.uri);
        let pipeline1 = [
            {
                '$group': {
                    '_id': { 'shard': '$shard' },
                    'chunks': { '$sum': 1 }
                }
            },
            { '$project': { '_id': 0, 'shard': '$_id.shard', 'chunks': 1 } }
        ]
        let pipeline2: any = [{
            '$group': {
                '_id': "$uuid",
                'chunks': {
                    '$sum': 1
                }
            }
        }, {
            '$project': {
                '_id': 1,
                'chunks': 1
            }
        }, {
            '$sort': {
                'chunks': -1
            }
        }, {
            '$limit': 10
        }, {
            $lookup: {
                from: "collections",
                localField: "_id",
                foreignField: "uuid",
                as: "collection"
            }
        }, {
            $project: {
                _id: 0,
                chunks: 1,
                collection: "$collection._id"
            }
        }, {
            $unwind: "$collection"
        }]

        let pipeline3 = [{
            '$match': {
                'what': 'moveChunk.commit'
            }
        },
        {
            '$group': {
                '_id': {
                    'date': {
                        '$dateToString': {
                            'format': '%Y-%m-%dT%H',
                            'date': '$time'
                        }
                    },
                    'ns': '$ns',
                    'from': '$details.from',
                    'to': '$details.to',
                },
                'chunks_moved': {
                    '$sum': 1
                },
                'docs_moved': {
                    '$sum': '$details.cloned'
                },
                'bytes_moved': {
                    '$sum': '$details.clonedBytes'
                },
                'counts_docs_moved': {
                    '$sum': '$details.counts.cloned'
                },
                'counts_bytes_moved': {
                    '$sum': '$details.counts.clonedBytes'
                }
            }
        },
        {
            '$sort': {
                '_id.date': -1,
                '_id.ns': 1,
                '_id.from': 1,
                '_id.to': 1
            }
        },
        {
            '$group': {
                '_id': {
                    'date': '$_id.date',
                },
                'details': {
                    '$push': {
                        'ns': '$_id.ns',
                        'from': '$_id.from',
                        'to': '$_id.to',
                        'chunks_moved': '$chunks_moved',
                        'docs_moved': '$docs_moved',
                        'bytes_moved': '$bytes_moved',
                        'counts_docs_moved': '$counts_docs_moved',
                        'counts_bytes_moved': '$counts_bytes_moved'
                    }
                },
                'chunks_moved': {
                    '$sum': '$chunks_moved'
                },
                'docs_moved': {
                    '$sum': '$docs_moved'
                },
                'bytes_moved': {
                    '$sum': '$bytes_moved'
                },
                'counts_docs_moved': {
                    '$sum': '$counts_docs_moved'
                },
                'counts_bytes_moved': {
                    '$sum': '$counts_bytes_moved'
                }
            }
        },
        {
            '$sort': {
                '_id.date': -1
            }
        },
        {
            '$project': {
                '_id': 0,
                'date': '$_id.date',
                'chunks_moved': 1,
                'docs_moved': 1,
                'data_moved(MB)': {
                    '$divide': ['$bytes_moved', (1024 * 1024)]
                },
                'counts_docs_moved': 1,
                'counts_data_moved(MB)': {
                    '$divide': ['$counts_bytes_moved', (1024 * 1024)]
                },
                'details': 1
            }
        },
        {
            '$limit': 20
        }
        ];


        const date = new Date(moment().subtract(1, "days"))
        let pipeline4 = [
            {
                '$match': {
                    'what': {
                        '$regex': new RegExp('split'),
                        '$options': 'i'
                    },
                    'details.number': { '$ne': 1 },
                    'time': { '$gte': date }
                }
            },
            {
                '$project': {
                    'time': 1,
                    'ns': 1,
                    'shard': { '$ifNull': ['$details.owningShard', ''] }

                }
            },
            {
                '$group': {
                    '_id': {
                        'date': { '$dateToString': { 'format': '%Y-%m-%dT%H', 'date': '$time' } },
                        'ns': '$ns',
                        'shard': '$shard',
                    },
                    'chunks_split': { '$sum': 1 },
                }
            },
            { '$sort': { '_id.date': -1, '_id.ns': 1, '_id.shard': 1 } },
            {
                '$group': {
                    '_id': {
                        'date': '$_id.date',
                    },
                    'details': { '$push': { 'ns': '$_id.ns', 'shard': '$_id.shard', 'chunks_split': '$chunks_split' } },
                    'chunks_split': { '$sum': '$chunks_split' }
                },
            },
            { '$sort': { '_id.date': -1 } },
            { '$project': { '_id': 0, 'date': '$_id.date', 'chunks_split': 1, 'details': 1 } },
            { '$limit': 24 }
        ];

        const chunksInShard = await this.adapter.runAggregation("chunks", pipeline1);
        const fiveLargestShardedCollection = await this.adapter.runAggregation("chunks", pipeline2);
        const migrationResult = await this.adapter.runAggregation("changelog", pipeline3);
        const chunkSplitResult = await this.adapter.runAggregation("changelog", pipeline4);

        const result = {
            "chunks Distribution": chunksInShard,
            "Top 10 largest sharded namespaces": fiveLargestShardedCollection,
            "Migration movement in last 1 day": migrationResult,
            "Chunks Splits": chunkSplitResult
        }
        console.log(result);
        let writeStatus = await this.shardStatusDB2.insert(result);


    }
}





