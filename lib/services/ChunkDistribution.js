"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkDistribution = void 0;
var mongodb_adapter_1 = require("../adapters/mongodb.adapter");
var moment = require('moment');
var ChunkDistribution = /** @class */ (function () {
    function ChunkDistribution(uri) {
        this.uri = uri;
        this.adapter = new mongodb_adapter_1.MongoDBAdapter();
    }
    ChunkDistribution.prototype.print = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pipeline1, pipeline2, pipeline3, date, pipeline4, chunksInShard, fiveLargestShardedCollection, migrationResult, chunkSplitResult, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.adapter.connect(this.uri, 'config')];
                    case 1:
                        _a.sent();
                        pipeline1 = [
                            {
                                '$group': {
                                    '_id': { 'shard': '$shard' },
                                    'chunks': { '$sum': 1 }
                                }
                            },
                            { '$project': { '_id': 0, 'shard': '$_id.shard', 'chunks': 1 } }
                        ];
                        pipeline2 = [{
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
                            }];
                        pipeline3 = [{
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
                        date = new Date(moment().subtract(1, "days"));
                        pipeline4 = [
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
                        return [4 /*yield*/, this.adapter.runAggregation("chunks", pipeline1)];
                    case 2:
                        chunksInShard = _a.sent();
                        return [4 /*yield*/, this.adapter.runAggregation("chunks", pipeline2)];
                    case 3:
                        fiveLargestShardedCollection = _a.sent();
                        return [4 /*yield*/, this.adapter.runAggregation("changelog", pipeline3)];
                    case 4:
                        migrationResult = _a.sent();
                        return [4 /*yield*/, this.adapter.runAggregation("changelog", pipeline4)];
                    case 5:
                        chunkSplitResult = _a.sent();
                        result = {
                            "chunks Distribution": chunksInShard,
                            "Top 10 largest sharded namespaces": fiveLargestShardedCollection,
                            "Migration movement in last 1 day": migrationResult,
                            "Chunks Splits": chunkSplitResult
                        };
                        return [2 /*return*/];
                }
            });
        });
    };
    return ChunkDistribution;
}());
exports.ChunkDistribution = ChunkDistribution;
//# sourceMappingURL=ChunkDistribution.js.map