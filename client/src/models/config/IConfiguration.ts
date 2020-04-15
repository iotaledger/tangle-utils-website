import { IClientNetworkConfiguration } from "./IClientNetworkConfiguration";

export interface IConfiguration {
    /**
     * The networks.
     */
    networks: IClientNetworkConfiguration[];

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
