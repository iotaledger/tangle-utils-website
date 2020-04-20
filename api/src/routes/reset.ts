import { ServiceFactory } from "../factories/serviceFactory";
import { IConfiguration } from "../models/configuration/IConfiguration";
import { ZmqService } from "../services/zmqService";

/**
 * Reset the ZMQ feeds.
 * @param config The configuration.
 * @returns The response.
 */
export async function reset(config: IConfiguration): Promise<string[]> {
    let log = "Resetting\n";

    try {
        for (const networkConfig of config.networks) {
            const zmqService = ServiceFactory.get<ZmqService>(`zmq-${networkConfig.network}`);
            zmqService.disconnect();
            await zmqService.connect();
        }
    } catch (err) {
        log += `Failed\n${err.toString()}\n`;
    }

    if (log.indexOf("Failed") < 0) {
        log += "Reset Succeeded";
    } else {
        log += "Reset Failed";
    }

    return log.split("\n");
}
