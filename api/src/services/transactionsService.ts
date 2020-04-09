import { asTransactionObject } from "@iota/transaction-converter";
import { ServiceFactory } from "../factories/serviceFactory";
import { ITransactionsSubscriptionMessage } from "../models/api/ITransactionsSubscriptionMessage";
import { INetworkConfiguration } from "../models/configuration/INetworkConfiguration";
import { Network } from "../models/network";
import { ITxTrytes } from "../models/zmq/ITxTrytes";
import { TrytesHelper } from "../utils/trytesHelper";
import { ZmqService } from "./zmqService";

/**
 * Class to handle transactions service.
 */
export class TransactionsService {
    /**
     * The transaction per second interval.
     */
    private static readonly TPS_INTERVAL: number = 5;

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
     * The most recent transactions.
     */
    private readonly _transactions: {
        [key in Network]?: { [hash: string]: number }
    };

    /**
     * The tps history.
     */
    private readonly _tps: {
        [key in Network]?: number[]
    };

    /**
     * The current total since last timestamp.
     */
    private readonly _totals: {
        [key in Network]?: number
    };

    /**
     * The last time we sent any data.
     */
    private _lastSend: number;

    /**
     * Subscription ids.
     */
    private readonly _subscriptionIds: {
        [key in Network]?: string
    };

    /**
     * Timer id.
     */
    private _timerId?: NodeJS.Timer;

    /**
     * Timer counter.
     */
    private _timerCounter: number;

    /**
     * The callback for different events.
     */
    private readonly _subscribers: {
        [id: string]: (data: ITransactionsSubscriptionMessage) => void;
    };

    /**
     * Create a new instance of TransactionsService.
     * @param networkConfigurations The network configurations.
     */
    constructor(networkConfigurations: INetworkConfiguration[]) {
        this._networkConfigurations = networkConfigurations;

        this._zmqServices = {};
        this._transactions = {};
        this._tps = {};
        this._totals = {};
        this._subscriptionIds = {};
        this._subscribers = {};
        this._lastSend = 0;
        this._timerCounter = 0;
    }

    /**
     * Initialise the service.
     */
    public async init(): Promise<void> {
        for (const networkConfig of this._networkConfigurations) {
            const zmqService = ServiceFactory.get<ZmqService>(`zmq-${networkConfig.network}`);

            if (zmqService) {
                this._zmqServices[networkConfig.network] = zmqService;
                this._transactions[networkConfig.network] = {};
                this._tps[networkConfig.network] = [];
                this._totals[networkConfig.network] = 0;
            }
        }

        this.startTimer();
        await this.startZmq();
    }

    /**
     * Reset the service.
     */
    public async reset(): Promise<void> {
        this.stopTimer();
        this.stopZmq();

        this.startTimer();
        await this.startZmq();
    }

    /**
     * Subscribe to transactions feed.
     * @param callback The callback to call with data for the event.
     * @returns An id to use for unsubscribe.
     */
    public subscribe(callback: (data: ITransactionsSubscriptionMessage) => void): string {
        const id = TrytesHelper.generateHash(27);
        this._subscribers[id] = callback;
        return id;
    }

    /**
     * Unsubscribe from the feed.
     * @param subscriptionId The id to unsubscribe.
     */
    public unsubscribe(subscriptionId: string): void {
        delete this._subscribers[subscriptionId];
    }

    /**
     * Update the subscriptions with newest trytes.
     */
    private async updateSubscriptions(): Promise<void> {
        const now = Date.now();
        let anyMore = false;
        let anyMore5 = false;

        for (const network in this._zmqServices) {
            const tranCount = Object.keys(this._transactions[network]).length;
            if (tranCount >= 1) {
                anyMore = true;
            }
            if (tranCount >= 5) {
                anyMore5 = true;
            }
        }

        if (anyMore5 ||
            (now - this._lastSend > 15000 && anyMore)) {

            const data: ITransactionsSubscriptionMessage = {
                transactions: this._transactions,
                tps: this._tps,
                tpsInterval: TransactionsService.TPS_INTERVAL
            };

            for (const subscriptionId in this._subscribers) {
                this._subscribers[subscriptionId](data);
            }

            for (const network in this._zmqServices) {
                this._transactions[network] = {};
            }
            this._lastSend = now;
        }
    }

    /**
     * Handle the transactions per second calculations.
     */
    private handleTps(): void {
        for (const network in this._zmqServices) {
            const lastTotal = this._totals[network];
            this._totals[network] = 0;
            this._tps[network].unshift(lastTotal);
            this._tps[network] = this._tps[network].slice(0, 100);
        }
    }

    /**
     * Start the zmq services.
     */
    private async startZmq(): Promise<void> {
        this.stopZmq();

        for (const network in this._zmqServices) {
            const config = this._networkConfigurations.find(n => n.network === network);
            const txMessage = config.zmqTransactionMessage || "tx_trytes";
            this._subscriptionIds[network] = await this._zmqServices[network].subscribe(
                txMessage, async (evnt: string, message: ITxTrytes) => {
                    if (!this._transactions[network][message.hash]) {
                        this._totals[network]++;
                        const tx = asTransactionObject(message.trytes);
                        this._transactions[network][message.hash] = tx.value;
                    }
                });
        }
    }

    /**
     * Stop the zmq services.
     */
    private stopZmq(): void {
        for (const network in this._zmqServices) {
            this._totals[network] = 0;
            if (this._subscriptionIds[network]) {
                this._zmqServices[network].unsubscribe(this._subscriptionIds[network]);
                delete this._subscriptionIds[network];
            }
        }
    }

    /**
     * Start the timer for tps.
     */
    private startTimer(): void {
        this.stopTimer();
        this._timerId = setInterval(
            async () => {
                if (this._timerCounter++ % TransactionsService.TPS_INTERVAL === 0) {
                    this.handleTps();
                }
                await this.updateSubscriptions();
            },
            1000);
    }

    /**
     * Stop the timer for tps.
     */
    private stopTimer(): void {
        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = undefined;
        }
    }
}
