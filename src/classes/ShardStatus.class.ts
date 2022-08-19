import { ShardStatusModel, BalancerStatus } from "../models/ShardStatus.model";
import { MongoDBAdapter } from "../adapters/mongodb.adapter"

export class Shards {

    private shardStatusModel: ShardStatusModel;
    private mongodbAdapter: MongoDBAdapter;

    constructor() {
        this.mongodbAdapter = new MongoDBAdapter;
        this.shardStatusModel = {
            Balancer: { mode: "", inBalancerRound: false, numBalancerRounds: 0 },
            ShardsList: { map: {} }
        }
    }

    async getShardStatus() {

        await this.mongodbAdapter.connect("mongodb+srv://admin:passwordone@sharded-cluster.4xwip.mongodb.net/?retryWrites=true&w=majority", "admin");

        var balancer = await this.mongodbAdapter.runCommand({ balancerStatus: 1 });

        this.shardStatusModel.Balancer.mode = balancer.mode;
        this.shardStatusModel.Balancer.inBalancerRound = balancer.inBalancerRound;
        this.shardStatusModel.Balancer.numBalancerRounds = balancer.numBalancerRounds;

        var shardsList = await this.mongodbAdapter.runCommand({ getShardMap: 1 });

        // console.log(shardsList)


        this.shardStatusModel.ShardsList.map = JSON.stringify(shardsList.map)
        this.shardStatusModel.ShardsList.hosts = JSON.stringify(shardsList.hosts)
        this.shardStatusModel.ShardsList.connStrings = JSON.stringify(shardsList.connStrings)

        // console.log(this.shardStatusModel)
        return this.shardStatusModel;
    }


}