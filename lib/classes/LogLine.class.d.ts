import { LogLineModel, BaseObject } from "../models/LogLine.model";
export declare class LogLine {
    private logLine;
    private originalLogLine;
    private opType?;
    constructor(logLine: BaseObject);
    getLogLine(): LogLineModel;
    getOpType(): string;
    isAcceptableNamespace(): boolean;
    process_aggregation(): BaseObject;
    redact_v2(filter: BaseObject): string;
}
