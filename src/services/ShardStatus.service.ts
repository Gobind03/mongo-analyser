import { Shards } from "../classes/ShardStatus.class";
import { LocalDBAdapter } from "../adapters/nedb.adapter";


export class ShardStatus {

    private shardStatusDB: LocalDBAdapter;

    constructor() {
        this.shardStatusDB = new LocalDBAdapter("shardstatus")
    }

    async getStatus() {
        let shard = new Shards()
        let status = await shard.getShardStatus()
        console.log(status);
        let writeStatus = await this.shardStatusDB.insert(status);
    }
}