var mongoClient = require("mongodb").MongoClient,
    db;


class MongoDBAdapter {
    private db: any;

    async connect(con_string: string, db_name: any) {
        try {
            var connection = await mongoClient.connect(con_string, { useNewUrlParser: true });
            this.db = connection.db(db_name);
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

    async runAggregation(coll: string, query: any) {
        if (!query.length) {
            throw Error("mongoClient.findDocByAggregation: query is not an object");
        }
        return this.db.collection(coll).aggregate(query).toArray();
    }

    async getDocumentCountByQuery(coll: string, query: any) {
        return this.db.collection(coll).estimatedDocumentCount(query || {})
    }

    async runAdminCommand(command: any) {
        return this.db.collection("admin").runCommand(command);
    }

    async close() {
        return await this.db.close();
    }
}
