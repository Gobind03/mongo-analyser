export declare class LocalDBAdapter {
    private db_name;
    private datastore;
    constructor(db_name: string);
    insert(object: any): Boolean;
    fetch(query: any): any;
}
