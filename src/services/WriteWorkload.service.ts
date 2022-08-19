import { MongoDBAdapter } from "../adapters/mongodb.adapter";
import { LocalDBAdapter } from "../adapters/nedb.adapter";

export class WriteWorkload {

    private mongoDBAdapter: MongoDBAdapter;
    private connectionString: string;
    private writeWorkload: LocalDBAdapter;
    // private connection: any;

    constructor(connectionString: string) {
        this.mongoDBAdapter = new MongoDBAdapter();
        this.connectionString = connectionString;
        this.writeWorkload = new LocalDBAdapter("writeWorkload")
    }

    async getWriteWorkloadInfo() {
        await this.mongoDBAdapter.connect(this.connectionString, "local");
        let serverStatus = await this.mongoDBAdapter.runCommand({ serverStatus: 1 })

        let outObject = {
            currentConnections: serverStatus.connections.current,
            availableConnections: serverStatus.connections.available,
            totalCreatedConnections: serverStatus.connections.totalCreated,
            activeConnections: serverStatus.connections.active,
            bytesIn: serverStatus.network.bytesIn,
            bytesOut: serverStatus.network.bytesOut
        }

        this.writeWorkload.insert(outObject)

        let groupByOpType = await this.mongoDBAdapter.runAggregation("oplog.rs", [{
            $group: {
                _id: {
                    op: '$op',
                    ns: '$ns'
                },
                opCount: {
                    $sum: 1
                }
            }
        }])

        this.writeWorkload.insert(groupByOpType)

        let maxObjSizeInOplogPerOp = await this.mongoDBAdapter.runAggregation("oplog.rs", [{
            $addFields: {
                object_size: {
                    $bsonSize: '$$ROOT'
                }
            }
        }, {
            $sort: {
                object_size: -1
            }
        }, {
            $group: {
                _id: '$op',
                maxSize: {
                    $max: '$object_size'
                },
                originalDoc: {
                    $first: '$$ROOT'
                }
            }
        }]);

        this.writeWorkload.insert(maxObjSizeInOplogPerOp)

        console.log("Finished Processing");

        return {
            "connectionsInfo": outObject,
            "groupByOpType" : groupByOpType,
            "maxObjSizeInOplogPerOp": maxObjSizeInOplogPerOp
        }

        
    }
}