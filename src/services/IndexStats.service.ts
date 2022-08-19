import { MongoDBAdapter } from "../adapters/mongodb.adapter";

export class IndexStatsService {

    private mongoDBAdapter: MongoDBAdapter;
    private connectionString: string;
    // private connection: any;

    constructor (connectionString: string) {
        this.mongoDBAdapter = new MongoDBAdapter();
        this.connectionString = connectionString;
        this.mongoDBAdapter.connect(connectionString, "admin");
    }

    getListOfCollection() : void {
        let CollectionList = this.mongoDBAdapter.runAdminCommand({listCollections: 1})
    }    
}