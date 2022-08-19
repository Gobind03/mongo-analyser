export declare class MongoDBAdapter {
    private db;
    connect(con_string: string, db_name: any): Promise<void>;
    private isObject;
    findDocFieldsByFilter(coll: string, query: any, projection: any, lmt: Number): Promise<any>;
    runAggregation(coll: string, query: any): Promise<any>;
    getDocumentCountByQuery(coll: string, query: any): Promise<any>;
    runAdminCommand(command: any): Promise<any>;
    runCommand(commandInput: any): Promise<any>;
    close(): Promise<any>;
}
