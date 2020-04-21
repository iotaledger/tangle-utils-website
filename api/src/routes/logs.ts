import { ServiceFactory } from "../factories/serviceFactory";
import { IConfiguration } from "../models/configuration/IConfiguration";
import { LoggingService } from "../services/loggingService";

/**
 * Get the logs.
 * @param config The configuration.
 * @returns The response.
 */
export async function logs(config: IConfiguration): Promise<string> {
    const loggingService = ServiceFactory.get<LoggingService>("logging");
    return loggingService.getLogs().join("\n");
}
