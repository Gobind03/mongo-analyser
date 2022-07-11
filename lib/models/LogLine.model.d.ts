export interface LogTimestamp {
    $date: Date;
}
export interface BaseObject {
    [key: string]: any;
}
export interface StorageData {
    bytesRead: number;
    timeReadingMicros: number;
}
export interface Storage {
    data: StorageData;
}
export interface Command {
    find?: string;
    aggregate?: string;
    getMore?: string;
    update?: string;
    insert?: string;
    count?: string;
    allowDiskUse?: boolean;
    pipeline?: Array<BaseObject>;
    createIndexes?: any;
    filter?: BaseObject;
    limit?: number;
    batchSize?: number;
    singleBatch?: boolean;
    maxTimeMS: number;
    sort?: BaseObject;
    query?: BaseObject;
    updates?: BaseObject;
}
export interface Attr {
    type: string;
    ns: string;
    command: Command;
    appName: string;
    planSummary: string;
    keysExamined: number;
    docsExamined: number;
    cursorExhausted: boolean;
    numYields: number;
    nreturned: number;
    queryHash: string;
    planCacheKey: string;
    protocol: string;
    durationMillis: number;
    storage: Storage;
    originatingCommand?: BaseObject;
}
export interface LogLineModel {
    t: LogTimestamp;
    s: string;
    c: string;
    id: number;
    ctx: string;
    msg: string;
    attr: Attr;
}
