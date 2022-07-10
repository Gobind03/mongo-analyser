import { BaseObject } from "../models/LogLine.model";
import qs from "qs";


export const sort_by_key = (array: Array<any>, key: string) => {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
};

export const redact_v2 = (filter: BaseObject | string) => {
    if (!filter)
        return JSON.stringify({});
    const topLevelTokens = qs.stringify(filter).split("&");
    return JSON.stringify(qs.parse(topLevelTokens.map((tk: string) => {
        const [pre, val] = tk.split("=");
        return [pre, "1"].join("=")
    }).join("&")))
};