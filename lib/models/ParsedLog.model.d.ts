import { BaseObject } from "./LogLine.model";
export interface ParsedLog {
    "OpType": string;
    "Duration": number;
    "QTR"?: number | null;
    "Namespace": string;
    "Filter": BaseObject | string;
    "Sort": string;
    "Lookup": string;
    "Blocking": string;
    "Plan Summary": string;
    "App Name": string;
    "QueryHash": string;
    "Log": string;
}
export interface ParsedLogGrouped {
    "Count": number;
    "AvgTime": number;
    "OpType": string;
    "Filter": string;
    "AvgQTR": number;
    "Namespace": string;
    "Sort": string;
    "Most Degraded Plan": string;
    "Redacted": string;
}
