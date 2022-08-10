var Datastore = require('nedb');

export class LocalDBAdapter {

    private db_name: string;
    private datastore: any;
    constructor(db_name: string) {
        this.db_name = db_name;
        this.datastore = new Datastore({
            filename: this.db_name + ".db",
            autoload: true
        });
    }

    public insert(object: any): Boolean {
        return this.datastore.insert(object, (err: any, newDoc: any) => {
            if (err) return false;
            else return true;
        });
    }

    public fetch(query: any): any {
        return this.datastore.find(query, (err: any, docs: any) => {
            return docs;
        });
    }
}