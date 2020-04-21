
/**
 * Service to handle the logging.
 */
export class LoggingService {
    /**
     * The recorded logs.
     */
    public _logs: string[];

    constructor() {
        this._logs = [];
    }

    /**
     * Get the logs.
     * @param message The message.
     * @param optionalParams Additional logging params.
     */
    public log(message?: any, ...optionalParams: any[]): void {
        console.log(message, ...optionalParams);

        this._logs.push(`${message}: ${JSON.stringify(optionalParams)}`);

        this._logs = this._logs.slice(-500);
    }

    /**
     * Get the log entries.
     * @returns The logs.
     */
    public getLogs(): string[] {
        return this._logs;
    }

    /**
     * Clear the log entries.
     */
    public clear(): void {
        this._logs = [];
    }
}
