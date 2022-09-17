import { MongoDBAdapter } from "../adapters/mongodb.adapter";
import { LocalDBAdapter } from "../adapters/nedb.adapter";

export class IndexStats {

    private mongoDBAdapter: MongoDBAdapter;
    private connectionString: string;
    private username: string;
    private password: string;
    private indexStatsDB: LocalDBAdapter;
    // private connection: any;

    constructor (connectionString: string, username: string, password: string) {
        this.mongoDBAdapter = new MongoDBAdapter();
        this.connectionString = connectionString;
        this.username = username;
        this.password = password
        this.indexStatsDB = new LocalDBAdapter("indexStats")
    }

    async getAllIndexStats() {
        let members = await this.mongoDBAdapter.indexStats({replSetGetStatus:1}, this.connectionString, this.username, this.password)
        this.indexStatsDB.insert(members)
        return members
    }
}