import { ServiceFactory } from "../factories/serviceFactory";
import { Network } from "../models/api/network";
import { IAddress } from "../models/zmq/IAddress";
import { ZmqService } from "./zmqService";

/**
 * Class to handle milestones service.
 */
export class MilestonesService {
    /**
     * The address of the mainnet coordinator.
     */
    private static readonly MAINNET_COORDINATOR: string =
        "EQSAUZXULTTYZCLNJNTXQTQHOMOFZERHTCGTXOLTVAHKSA9OGAZDEKECURBRIXIJWNPFCQIOVFVVXJVD9";

    /**
     * The address of the devnet coordinator.
     */
    private static readonly DEVNET_COORDINATOR: string =
        "EQQFCZBIHRHWPXKMTOLMYUYPCN9XLMJPYZVFJSAY9FQHCCLWTOLLUGKKMXYFDBOOYFBLBI9WUEILGECYM";

    /**
     * The main net zmq service.
     */
    private _zmqMainNet: ZmqService;

    /**
     * The dev net zmq service.
     */
    private _zmqDevNet: ZmqService;

    /**
     * Subscription for mainnet.
     */
    private _subscriptionIdMainNet?: string;

    /**
     * Subscription for devnet.
     */
    private _subscriptionIdDevNet?: string;

    /**
     * Last mainnet
     */
    private _lastMainnet: number;

    /**
     * Last devnet
     */
    private _lastDevnet: number;

    /**
     * The most recent milestones.
     */
    private readonly _milestones: {
        [network: string]: {
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
     */
    constructor() {
        this._milestones = {
            mainnet: [],
            devnet: []
        };
    }

    /**
     * Initialise the milestones.
     */
    public init(): void {
        this._zmqMainNet = ServiceFactory.get<ZmqService>("zmq-mainnet");
        this._zmqDevNet = ServiceFactory.get<ZmqService>("zmq-devnet");

        this.initMainNet();
        this.initDevNet();

        setInterval(
            () => {
                const now = Date.now();

                if (now - this._lastMainnet > 5 * 60 * 1000) {
                    this.closeMainNet();
                    this.initMainNet();
                }

                if (now - this._lastDevnet > 5 * 60 * 1000) {
                    this.closeDevNet();
                    this.initDevNet();
                }
            },
            5000);
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
     * Initialise mainnet.
     */
    private initMainNet(): void {
        this._subscriptionIdMainNet = this._zmqMainNet.subscribeAddress(
            MilestonesService.MAINNET_COORDINATOR,
            async (evnt: string, message: IAddress) => {
                if (message.address === MilestonesService.MAINNET_COORDINATOR) {
                    this._lastMainnet = Date.now();
                    if (!this._milestones.mainnet.find(m => m.milestoneIndex === message.milestoneIndex)) {
                        this._milestones.mainnet.unshift({
                            hash: message.transaction,
                            milestoneIndex: message.milestoneIndex
                        });
                        this._milestones.mainnet = this._milestones.mainnet.slice(0, 100);
                    }
                }
            });
    }

    /**
     * Closedown mainnet.
     */
    private closeMainNet(): void {
        if (this._subscriptionIdMainNet) {
            this._zmqMainNet.unsubscribe(this._subscriptionIdMainNet);
            this._subscriptionIdMainNet = undefined;
        }
    }

    /**
     * Initialise devnet.
     */
    private initDevNet(): void {
        this._subscriptionIdDevNet = this._zmqDevNet.subscribeAddress(
            MilestonesService.DEVNET_COORDINATOR,
            async (evnt: string, message: IAddress) => {
                if (message.address === MilestonesService.DEVNET_COORDINATOR) {
                    this._lastDevnet = Date.now();
                    if (!this._milestones.devnet.find(m => m.milestoneIndex === message.milestoneIndex)) {
                        this._milestones.devnet.unshift({
                            hash: message.transaction,
                            milestoneIndex: message.milestoneIndex
                        });
                        this._milestones.devnet = this._milestones.devnet.slice(0, 100);
                    }
                }
            });
    }

    /**
     * Closedown devnet.
     */
    private closeDevNet(): void {
        if (this._subscriptionIdDevNet) {
            this._zmqDevNet.unsubscribe(this._subscriptionIdDevNet);
            this._subscriptionIdDevNet = undefined;
        }
    }
}
