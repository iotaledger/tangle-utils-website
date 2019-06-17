import { ServiceFactory } from "../factories/serviceFactory";
import { ITransactionsSubscriptionMessage } from "../models/api/ITransactionsSubscriptionMessage";
import { ITxTrytes } from "../models/zmq/ITxTrytes";
import { TrytesHelper } from "../utils/trytesHelper";
import { ZmqService } from "./zmqService";

/**
 * Class to handle transactions service.
 */
export class TransactionsService {
    /**
     * The main net zmq service.
     */
    private readonly _zmqMainNet: ZmqService;

    /**
     * The dev net zmq service.
     */
    private readonly _zmqDevNet: ZmqService;

    /**
     * The most recent main net transactions.
     */
    private _mainNetTransactions: string[];

    /**
     * The most recent dev net transactions.
     */
    private _devNetTransactions: string[];

    /**
     * The last time we sent any data.
     */
    private _lastSend: number;

    /**
     * Mainnet subscription id.
     */
    private _mainNetSubscriptionId: string;

    /**
     * Devnet subscription id.
     */
    private _devNetSubscriptionId: string;

    /**
     * The callback for different events.
     */
    private readonly _subscriptions: {
        [id: string]: (data: ITransactionsSubscriptionMessage) => void;
    };

    /**
     * Create a new instance of TransactionsService.
     */
    constructor() {
        this._zmqMainNet = ServiceFactory.get<ZmqService>("zmq-mainnet");
        this._zmqDevNet = ServiceFactory.get<ZmqService>("zmq-devnet");

        this._mainNetTransactions = [];
        this._devNetTransactions = [];
        this._lastSend = 0;

        this._subscriptions = {};
    }

    /**
     * Subscribe to transactions feed.
     * @param callback The callback to call with data for the event.
     * @returns An id to use for unsubscribe.
     */
    public subscribe(callback: (data: ITransactionsSubscriptionMessage) => void): string {
        if (Object.keys(this._subscriptions).length === 0) {
            this._mainNetSubscriptionId = this._zmqMainNet.subscribe("tx_trytes", async (evnt: string, message: ITxTrytes) => {
                this._mainNetTransactions.unshift(message.trytes);
                await this.updateSubscriptions();
            });
            this._devNetSubscriptionId = this._zmqDevNet.subscribe("tx_trytes", async (evnt: string, message: ITxTrytes) => {
                this._devNetTransactions.unshift(message.trytes);
                await this.updateSubscriptions();
            });
        }

        const id = TrytesHelper.generateHash(27);
        this._subscriptions[id] = callback;

        return id;
    }

    /**
     * Unsubscribe from the feed.
     * @param subscriptionId The id to unsubscribe.
     */
    public unsubscribe(subscriptionId: string): void {
        delete this._subscriptions[subscriptionId];

        if (Object.keys(this._subscriptions).length === 0) {
            this._zmqMainNet.unsubscribe(this._mainNetSubscriptionId);
            this._zmqDevNet.unsubscribe(this._devNetSubscriptionId);
        }
    }

    /**
     * Update the subscriptions with newest trytes.
     */
    private async updateSubscriptions(): Promise<void> {
        const now = Date.now();
        if (this._mainNetTransactions.length >= 5 ||
            this._devNetTransactions.length >= 5 ||
            (now - this._lastSend > 15000 &&
                (this._mainNetTransactions.length >= 0 || this._devNetTransactions.length >= 0))) {

            const data: ITransactionsSubscriptionMessage = {
                mainnetTransactions: this._mainNetTransactions.slice(),
                devnetTransactions: this._devNetTransactions.slice()
            };

            this._mainNetTransactions = [];
            this._devNetTransactions = [];
            this._lastSend = now;

            for (const subscriptionId in this._subscriptions) {
                this._subscriptions[subscriptionId](data);
            }
        }
    }
}
