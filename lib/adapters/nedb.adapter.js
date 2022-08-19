"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDBAdapter = void 0;
var Datastore = require('nedb');
var LocalDBAdapter = /** @class */ (function () {
    function LocalDBAdapter(db_name) {
        this.db_name = db_name;
        this.datastore = new Datastore({
            filename: this.db_name + ".db",
            autoload: true
        });
    }
    LocalDBAdapter.prototype.insert = function (object) {
        return this.datastore.insert(object, function (err, newDoc) {
            if (err)
                return false;
            else
                return true;
        });
    };
    LocalDBAdapter.prototype.fetch = function (query) {
        return this.datastore.find(query, function (err, docs) {
            return docs;
        });
    };
    return LocalDBAdapter;
}());
exports.LocalDBAdapter = LocalDBAdapter;
//# sourceMappingURL=nedb.adapter.js.map