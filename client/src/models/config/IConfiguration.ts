import { INodeConfiguration } from "./INodeConfiguration";

export interface IConfiguration {
    /**
     * The api endpoint for the utils.
     */
    apiEndpoint: string;

    /**
     * The mainnet node.
     */
    nodeMainnet: INodeConfiguration;

    /**
     * The devnet nodes to load balance.
     */
    nodeDevnet: INodeConfiguration;

    /**
     * The google maps key.
     */
    googleMapsKey: string;

    /**
     * The google analytics id.
     */
    googleAnalyticsId: string;
}
