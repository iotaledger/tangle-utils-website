import { ServiceFactory } from "../factories/serviceFactory";
import { INetworkConfiguration } from "../models/configuration/INetworkConfiguration";
import { Network } from "../models/network";
import { IAddress } from "../models/zmq/IAddress";
import { MilestoneStoreService } from "./milestoneStoreService";
import { ZmqService } from "./zmqService";

/**
 * Class to handle milestones service.
 */
export class MilestonesService {
    /**
     * The network configurations.
     */
    private readonly _networkConfigurations: INetworkConfiguration[];

    /**
     * The zmq service.
     */
    private readonly _zmqServices: {
        [key in Network]?: ZmqService
    };

    /**
     * The milestone store service.
     */
    private _milestoneStoreService: MilestoneStoreService;

    /**
     * Subscription ids.
     */
    private readonly _subscriptionIds: {
        [key in Network]?: string
    };

    /**
     * Last updates
     */
    private readonly _lastUpdates: {
        [key in Network]?: number
    };

    /**
     * Timer id.
     */
    private _timerId?: NodeJS.Timer;

    /**
     * Are we already updating.
     */
    private _updating: boolean;

    /**
     * The most recent milestones.
     */
    private readonly _milestones: {
        [key in Network]?: {
            /**
             * The transaction hash.
             */
            hash: string;
            /**
             * The milestone index.
             */
            milestoneIndex: number;
        }[]
    };

    /**
     * Create a new instance of MilestoneService.
     * @param networkConfigurations The network configurations.
     */
    constructor(networkConfigurations: INetworkConfiguration[]) {
        this._networkConfigurations = networkConfigurations;

        this._zmqServices = {};
        this._milestones = {};
        this._subscriptionIds = {};
        this._lastUpdates = {};
    }

    /**
     * Initialise the milestones.
     */
    public async init(): Promise<void> {
        for (const networkConfig of this._networkConfigurations) {
            const zmqService = ServiceFactory.get<ZmqService>(`zmq-${networkConfig.network}`);

            if (zmqService) {
                this._zmqServices[networkConfig.network] = zmqService;
                this._milestones[networkConfig.network] = [];
            }
        }

        this._milestoneStoreService = ServiceFactory.get<MilestoneStoreService>("milestone-store");

        if (this._milestoneStoreService) {
            for (const network in this._zmqServices) {
                const store = await this._milestoneStoreService.get(network);
                if (store && store.indexes) {
                    this._milestones[network] = store.indexes;
                }
            }
        }

        for (const network in this._zmqServices) {
            await this.initNetwork(network as Network);
        }

        this.startTimer();
    }

    /**
     * Reset the services.
     */
    public async reset(): Promise<void> {
        this.stopTimer();

        for (const network in this._zmqServices) {
            this.closeNetwork(network as Network);
        }

        for (const network in this._zmqServices) {
            await this.initNetwork(network as Network);
        }

        this.startTimer();
    }

    /**
     * Get the milestones for the request network.
     * @param network The network to get.
     * @returns The milestones for the network.
     */
    public getMilestones(network: Network): {
        /**
         * The transaction hash.
         */
        hash: string;
        /**
         * The milestone index.
         */
        milestoneIndex: number;
    }[] {
        return this._milestones[network];
    }

    /**
     * Initialise network.
     * @param network The network to initialise.
     */
    private async initNetwork(network: Network): Promise<void> {
        const conf = this._networkConfigurations.find(nc => nc.network === network);

        this._subscriptionIds[network] = await this._zmqServices[network].subscribeAddress(
            conf.coordinatorAddress,
            async (evnt: string, message: IAddress) => {
                if (message.address === conf.coordinatorAddress) {
                    this._lastUpdates[network] = Date.now();

                    if (!this._milestones[network].find(m => m.milestoneIndex === message.milestoneIndex)) {
                        this._milestones[network].unshift({
                            hash: message.transaction,
                            milestoneIndex: message.milestoneIndex
                        });
                        this._milestones[network] = this._milestones[network].slice(0, 100);

                        if (this._milestoneStoreService) {
                            try {
                                await this._milestoneStoreService.set({
                                    network,
                                    indexes: this._milestones[network]
                                });
                            } catch (err) {
                                console.error(`Failed writing ${network} milestone store`, err);
                            }
                        }
                    }
                }
            });
    }

    /**
     * Closedown network.
     * @param network The network to closedown.
     */
    private closeNetwork(network: Network): void {
        if (this._subscriptionIds[network]) {
            this._zmqServices[network].unsubscribe(this._subscriptionIds[network]);
            delete this._subscriptionIds[network];
        }
    }

    /**
     * Start the timer for idle timeout.
     */
    private startTimer(): void {
        this.stopTimer();
        this._timerId = setInterval(
            async () => {
                if (!this._updating) {
                    this._updating = true;
                    const now = Date.now();

                    for (const network in this._zmqServices) {
                        try {

                            if (now - this._lastUpdates[network] > 5 * 60 * 1000) {
                                this.closeNetwork(network as Network);
                                await this.initNetwork(network as Network);
                            }
                        } catch (err) {
                            console.error(`Failed processing ${network} idle timeout`, err);
                        }
                    }

                    this._updating = false;
                }
            },
            5000);
    }

    /**
     * Stop the idle timer.
     */
    private stopTimer(): void {
        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = undefined;
        }
    }
}
