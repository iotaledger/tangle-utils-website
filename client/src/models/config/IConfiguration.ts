import { INetworkConfiguration } from "./INetworkConfiguration";

export interface IConfiguration {
    /**
     * The networks.
     */
    networks: INetworkConfiguration[];

    /**
     * The api endpoint for the utils.
     */
    apiEndpoint: string;

    /**
     * The google maps key.
     */
    googleMapsKey: string;

    /**
     * The google analytics id.
     */
    googleAnalyticsId: string;
}
