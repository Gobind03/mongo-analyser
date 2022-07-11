const qs = require("qs");
import { LogLineModel, BaseObject } from "../models/LogLine.model";


export class LogLine {

    private logLine: LogLineModel;
    private originalLogLine: BaseObject;
    private opType?: string;

    constructor(logLine: BaseObject) {
        this.originalLogLine = logLine;
        this.logLine = <LogLineModel>this.originalLogLine;
        this.opType = this.getOpType();
    }

    getLogLine(): LogLineModel {
        return this.logLine;
    }

    getOpType(): string {
        if (!this.logLine.attr)
            return "";
        if (!this.logLine.attr.command)
            return "";
        if (this.logLine.attr.command.insert != null)
            return "Insert";
        else if (this.logLine.attr.command.find != null)
            return "Find";
        else if (this.logLine.attr.command.update != null)
            return "Update";
        else if (this.logLine.attr.command.getMore != null)
            return "getMore";
        else if (this.logLine.attr.command.aggregate != null)
            return "Aggregate";
        else if (this.logLine.attr.command.count != null)
            return "Count";
        else
            return "";
    }

    isAcceptableNamespace(): boolean {
        const nsSplit = this.logLine.attr.ns.split(".");
        const notAllowedNamespaces = ["admin", "local", "config"];

        if (notAllowedNamespaces.indexOf(nsSplit[0])) {
            return false;
        }

        if (nsSplit[1] === "$cmd") {
            return false;
        }

        if (this.logLine.attr?.appName.includes("mongot")) {
            return false;
        }

        if (this.logLine.attr.command.createIndexes) {
            return false;
        }

        return true;
    }

    process_aggregation(): BaseObject {
        let final_data = {
            filter: {},
            sort: "",
            blocking: "No",
            lookup: "No"
        };
        if (this.opType == "Aggregate") return final_data;
        let pipeline = this.logLine.attr.command.pipeline as Array<BaseObject> || [];
        for (let i = 0; i < pipeline.length; i++) {
            let stage = "";
            for (let key in pipeline[i]) {
                stage = key;
                break;
            }
            if (stage === "$match") {
                // final_data.filter = final_data.filter + " " + JSON.stringify(pipeline[i]["$match"]);
                final_data.filter = pipeline[i]["$match"];
            }
            if (stage === "$sort") {
                final_data.sort = final_data.sort + " " + JSON.stringify(pipeline[i]["$sort"]);
            }
            if (stage === "$lookup") {
                final_data.lookup = "Yes";
            }
            if (stage === "$group" || stage === "$bucket" || stage === "$bucketAuto") {
                final_data.blocking = "Yes";
            }
        }

        if (final_data.sort === "") final_data.sort = "N.A."
        if (final_data.filter === "") final_data.sort = JSON.stringify({})

        return final_data;
    };

    redact_v2(filter: BaseObject): string {
        const topLevelTokens = qs.stringify(filter).split("&");
        return JSON.stringify(qs.parse(topLevelTokens.map((tk: string) => {
            const [pre, val] = tk.split("=");
            return [pre, "1"].join("=")
        }).join("&")))
    }

}