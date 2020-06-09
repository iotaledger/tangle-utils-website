
import { INodeConfiguration } from "./INodeConfiguration";

/**
 * Definition of network configuration file.
 */
export interface IClientNetworkConfiguration {
    /**
     * The network.
     */
    network: string;

    /**
     * The label.
     */
    label: string;

    /**
     * The node to communicate with.
     */
    node: INodeConfiguration;

    /**
     * The address of the coordinator.
     */
    coordinatorAddress: string;

    /**
     * The level of the coordinator security.
     */
    coordinatorSecurityLevel: number;
}
