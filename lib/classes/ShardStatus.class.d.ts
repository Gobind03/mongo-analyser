import { ShardStatusModel } from "../models/ShardStatus.model";
export declare class Shards {
    private shardStatusModel;
    private mongodbAdapter;
    constructor();
    getShardStatus(): Promise<ShardStatusModel>;
}
