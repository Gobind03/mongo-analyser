export declare class LogStreamer {
    private logList;
    private logFile;
    private isGrouped;
    private limit;
    private uiPageSize;
    private slowMs;
    private htmlGenerator?;
    private parsedLogListDB;
    constructor(logFilePath: string, isGrouped: boolean, limit: number, uiPageSize: number, slowMs: number);
    stream(): void;
}
