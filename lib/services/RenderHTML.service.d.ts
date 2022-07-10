import { BaseObject } from "../models/LogLine.model";
import { ParsedLog, ParsedLogGrouped } from "../models/ParsedLog.model";
export declare class RenderHTML {
    private logList;
    constructor(parsedLog: Array<ParsedLog> | Array<ParsedLogGrouped>);
    renderLogParserData(page_size: number | undefined, summary: BaseObject): void;
}
