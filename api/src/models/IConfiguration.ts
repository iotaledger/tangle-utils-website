import { IAWSDynamoDbConfiguration } from "./IAWSDynamoDbConfiguration";
import { IZmqConfiguration } from "./IZmqConfiguration";

/**
 * Definition of configuration file.
 */
export interface IConfiguration {
    /**
     * The coin market cap api key.
     */
    cmcApiKey: string;

    /**
     * The fixer api key.
     */
    fixerApiKey: string;

    /**
     * The dynamic db connection.
     */
    dynamoDbConnection: IAWSDynamoDbConfiguration;

    /**
     * The configuration for mainnet zmq endpoint.
     */
    zmqMainNet: IZmqConfiguration;

    /**
     * The configuration for devnet zmq endpoint.
     */
    zmqDevNet: IZmqConfiguration;
}
