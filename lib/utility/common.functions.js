"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redact_v2 = exports.sort_by_key = void 0;
var qs_1 = __importDefault(require("qs"));
var sort_by_key = function (array, key) {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
};
exports.sort_by_key = sort_by_key;
var redact_v2 = function (filter) {
    if (!filter)
        return JSON.stringify({});
    var topLevelTokens = qs_1.default.stringify(filter).split("&");
    return JSON.stringify(qs_1.default.parse(topLevelTokens.map(function (tk) {
        var _a = tk.split("="), pre = _a[0], val = _a[1];
        return [pre, "1"].join("=");
    }).join("&")));
};
exports.redact_v2 = redact_v2;
