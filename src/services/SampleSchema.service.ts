import { MongoDBAdapter } from "../adapters/mongodb.adapter";
import { LocalDBAdapter } from "../adapters/nedb.adapter";
const fs = require('fs');
export class SampleSchema {
    private mongoDBAdapter: MongoDBAdapter;
    private connectionString: string;
    private parsedLogListDB: LocalDBAdapter;
    // private connection: any;
    constructor(connectionString: string) {
        this.mongoDBAdapter = new MongoDBAdapter();
        this.connectionString = connectionString;
        this.parsedLogListDB = new LocalDBAdapter("sampleSchema");

    }
    async getSchemaSet() {
        await this.mongoDBAdapter.connect(this.connectionString, "admin");
        // await this.mongoDBAdapter.coreConnect();
        let dbs = await this.mongoDBAdapter.runCommand({ listDatabases: 1 });
        let databaseList = dbs.databases;
        let dbPromises: any = [];
        let schemaSet: any[] = [];
        for (var i = 0; i < databaseList.length; i++) {
            let database = databaseList[i];
            let databaseName: string = database.name;
            if (databaseName !== "admin" && databaseName !== "local" && databaseName !== "config" && databaseName !== "") {
                let databaseSchema = await this.getSampleSchema(databaseName);
                schemaSet.push({ "databaseName": databaseName, collections: databaseSchema })
            }
        }
        this.parsedLogListDB.insert(schemaSet);
        fs.writeFile("books.json", JSON.stringify(schemaSet), (err: any) => {
            if (err) { console.log(err) }
        });
        return schemaSet;
    }
    async getSampleSchema(databaseName: string) {
        let collection = await this.mongoDBAdapter.listCollections(databaseName);
        let collectionsMap: any[] = []
        for (var i = 0; i < collection.length; i++) {
            let col = collection[i];
            let items = await this.mongoDBAdapter.runAggregation(col.name, [{ "$sample": { size: 1 } }], databaseName);
            collectionsMap.push({ collectionName: col.name, sampleSchema: items })
        }
        return collectionsMap;
    }
}