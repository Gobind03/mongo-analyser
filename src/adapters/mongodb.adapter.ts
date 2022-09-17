var mongoClient = require("mongodb").MongoClient,
    db;
import { LocalDBAdapter } from "../adapters/nedb.adapter";

var fs = require('fs');
var lodash = require('lodash');

export class MongoDBAdapter {
    private db: any;
    private connection: any;
    private coreConnection: any;
    async connect(con_string: string, db_name?: any) {
        try {
            this.connection = await mongoClient.connect(con_string, { useNewUrlParser: true });
            this.db = this.connection.db(db_name ? db_name : "test");
            console.log("MongoClient Connection successfull.");
        }
        catch (ex) {
            console.error("MongoDB Connection Error.,", ex);
        }
    }

    private isObject(obj: any) {
        return Object.keys(obj).length > 0 && obj.constructor === Object;
    }

    async findDocFieldsByFilter(coll: string, query: any, projection: any, lmt: Number) {
        if (!query) {
            throw Error("mongoClient.findDocFieldsByFilter: query is not an object");
        }
        return await this.db.collection(coll).find(query, {
            projection: projection || {},
            limit: lmt || 0
        }).toArray();
    }

    async runAggregation(coll: string, query: any, db?: any) {
        if (!query.length) {
            throw Error("mongoClient.findDocByAggregation: query is not an object");
        }
        if (db) {
            return await this.connection.db(db).collection(coll).aggregate(query).toArray();
        } else {
            return await this.db.collection(coll).aggregate(query).toArray();
        }

    }

    async getDocumentCountByQuery(coll: string, query: any) {
        return this.db.collection(coll).estimatedDocumentCount(query || {})
    }

    async runAdminCommand(command: any) {
        return this.db.collection("admin").runCommand(command);
    }

    async runCommand(command: any, database?: string) {
        if (!database) {
            return await this.db.command(command);
        } else {
            console.log(this.db.collection(database));
            return await this.connection.db(database).command(command);
        }
    }

    async listCollections(database?: string) {
        return await this.connection.db(database).listCollections().toArray();
    }

    async indexStats(command: any, conenctionString: string, username: string, password: string) {
        try {
            var c1 = await mongoClient.connect(conenctionString, { useNewUrlParser: true });

            var db2 = await c1.db('admin');

            var c2 = await db2.command({ replSetGetConfig: 1 });

            var hosts = await db2.command({ hello: 1 })

            var atlasName: any = hosts.setName;

            var hosts = hosts.hosts;

            const urls: any = []

            for (let eachHost in hosts) {
                let obj: any = {
                    url: "mongodb://" + username + ":" + password + "@" + hosts[eachHost] + "/?ssl=true&replicaSet=" + atlasName + "&authSource=admin",
                    tag: hosts[eachHost]
                }

                urls.push(obj);
            }

            const dbName: string = 'admin';
            let idx_stats: any = [];

            for (let each_url in urls) {

                const client = new mongoClient(urls[each_url].url);
                client.connect(function (err: any, db: any) {
                    const admin = db.db(dbName).admin();

                    admin.listDatabases(async (err: any, dbs: any) => {

                        for (let val in dbs.databases) {
                            if (dbs.databases[val].name == "admin" || dbs.databases[val].name == "local" || dbs.databases[val].name == "config") {
                                console.log("Skipping " + dbs.databases[val].name)
                            } else {
                                let collections = await db.db(dbs.databases[val].name).listCollections().toArray();
                                for (let each_collection in collections) {
                                    if (collections[each_collection].name == "system.views") {
                                        console.log("skipping")
                                    } else {
                                        let index_stats = await db.db(dbs.databases[val].name).collection(collections[each_collection].name).aggregate([{ $indexStats: {} }]).toArray();
                                        if (index_stats && index_stats.length > 0) {
                                            index_stats.forEach((each_stat: any) => {
                                                each_stat['tag'] = urls[each_url].tag;
                                                each_stat['collection_name'] = collections[each_collection].name;
                                                idx_stats.push(each_stat)
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            }

            setTimeout(() => {
                console.log("Please wait writing file to disk");
            }, 5000)

            setTimeout(() => {
                let stats = lodash.groupBy(idx_stats, (idx_stat: any) => { return idx_stat.collection_name });
                fs.writeFileSync('output.db', JSON.stringify(stats));
                fs.writeFileSync('output.json', JSON.stringify(stats));
                console.log("File written to disk");
            }, 30000)
        } catch (err) {
            console.log(err);
        }
    }

    async close() {
        return await this.db.close();
    }
}