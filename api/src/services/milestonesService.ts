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
     * Subscribe to transactions feed.
     * @param callback The callback to call with data for the event.
     */
    public init(): void {
        this._zmqMainNet = ServiceFactory.get<ZmqService>("zmq-mainnet");
        this._zmqDevNet = ServiceFactory.get<ZmqService>("zmq-devnet");

        this._zmqMainNet.subscribeAddress(
            MilestonesService.MAINNET_COORDINATOR,
            async (evnt: string, message: IAddress) => {
                console.log("mainnet", message);
                if (message.address === MilestonesService.MAINNET_COORDINATOR) {
                    if (!this._milestones.mainnet.find(m => m.milestoneIndex === message.milestoneIndex)) {
                        this._milestones.mainnet.unshift({
                            hash: message.transaction,
                            milestoneIndex: message.milestoneIndex
                        });
                        this._milestones.mainnet = this._milestones.mainnet.slice(0, 100);
                    }
                }
            });
        this._zmqDevNet.subscribeAddress(
            MilestonesService.DEVNET_COORDINATOR,
            async (evnt: string, message: IAddress) => {
                console.log("devnet", message);
                if (message.address === MilestonesService.DEVNET_COORDINATOR) {
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
}
