import { INodeConfiguration } from "./INodeConfiguration";

export interface IConfiguration {
    /**
     * The api endpoint for the utils.
     */
    apiEndpoint: string;

    /**
     * The mainnet nodes to load balance.
     */
    nodesMainnet: INodeConfiguration[];

    /**
     * The devnet nodes to load balance.
     */
    nodesDevnet: INodeConfiguration[];

    /**
     * The google maps key.
     */
    googleMapsKey: string;

    /**
     * The google analytics id.
     */
    googleAnalyticsId: string;
}
