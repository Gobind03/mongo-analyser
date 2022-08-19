import { MongoDBAdapter } from "../adapters/mongodb.adapter";
import bson from "@types/bson";

export class ChunkDistribution {
    private uri: string;
    private adapter;

    constructor(uri: string) {
        this.uri = uri;
        this.adapter = new MongoDBAdapter();
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

        let pipeline2: any = [
            {
                '$group': {
                    '_id': { env.ns_uuid: env.ns_uuid_value },
                    'chunks': { '$sum': 1 }
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'ns_uuid' : env._id_ns_uuid_value,
                    'chunks': 1,
                }
            },
            { '$sort': { 'chunks': - 1 } },
            { '$limit': 10 }
        ]



const chunksInShard = await this.adapter.runAggregation("chunks", pipeline);
const fiveLargestShardedCollection = await this.s
const result = {
    totalChunks: chunksInShard,

}
    }
}