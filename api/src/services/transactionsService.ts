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
     * The transaction per second interval.
     */
    private static readonly TPS_INTERVAL: number = 5;

    /**
     * The main net zmq service.
     */
    private _zmqMainNet: ZmqService;

    /**
     * The dev net zmq service.
     */
    private _zmqDevNet: ZmqService;

    /**
     * The most recent main net transactions.
     */
    private _mainNetTransactions: string[];

    /**
     * The tps history for main net.
     */
    private _mainNetTps: number[];

    /**
     * The most recent dev net transactions.
     */
    private _devNetTransactions: string[];

    /**
     * The tps history for dev net.
     */
    private _devNetTps: number[];

    /**
     * The current mainnet total since last timestamp.
     */
    private _mainNetTotal: number;

    /**
     * The current devnet total since last timestamp.
     */
    private _devNetTotal: number;

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
    private readonly _subscriptions: {
        [id: string]: (data: ITransactionsSubscriptionMessage) => void;
    };

    /**
     * Create a new instance of TransactionsService.
     */
    constructor() {
        this._mainNetTransactions = [];
        this._devNetTransactions = [];
        this._lastSend = 0;
        this._mainNetTps = [];
        this._mainNetTotal = 0;
        this._devNetTps = [];
        this._devNetTotal = 0;
        this._timerCounter = 0;

        this._subscriptions = {};
    }

    /**
     * Initialise the service.
     */
    public async init(): Promise<void> {
        this._zmqMainNet = ServiceFactory.get<ZmqService>("zmq-mainnet");
        this._zmqDevNet = ServiceFactory.get<ZmqService>("zmq-devnet");

        this.startTimer();
        this.startZmq();
    }

    /**
     * Reset the service.
     */
    public async reset(): Promise<void> {
        this.stopTimer();
        this.stopZmq();

        this.startTimer();
        this.startZmq();
    }

    /**
     * Subscribe to transactions feed.
     * @param callback The callback to call with data for the event.
     * @returns An id to use for unsubscribe.
     */
    public subscribe(callback: (data: ITransactionsSubscriptionMessage) => void): string {
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
                devnetTransactions: this._devNetTransactions.slice(),
                mainnetTps: this._mainNetTps,
                devnetTps: this._devNetTps,
                tpsInterval: TransactionsService.TPS_INTERVAL
            };

            this._mainNetTransactions = [];
            this._devNetTransactions = [];
            this._lastSend = now;

            for (const subscriptionId in this._subscriptions) {
                this._subscriptions[subscriptionId](data);
            }
        }
    }

    /**
     * Handle the transactions per second calculations.
     */
    private handleTps(): void {
        const lastMainNetTotal = this._mainNetTotal;
        const lastDevNetTotal = this._devNetTotal;
        this._mainNetTotal = 0;
        this._devNetTotal = 0;
        this._mainNetTps.unshift(lastMainNetTotal);
        this._devNetTps.unshift(lastDevNetTotal);

        this._mainNetTps = this._mainNetTps.slice(0, 100);
        this._devNetTps = this._devNetTps.slice(0, 100);
    }

    /**
     * Start the zmq services.
     */
    private startZmq(): void {
        this.stopZmq();

        this._mainNetSubscriptionId = this._zmqMainNet.subscribe(
            "tx_trytes", async (evnt: string, message: ITxTrytes) => {
                if (!this._mainNetTransactions.includes(message.trytes)) {
                    this._mainNetTotal++;
                    this._mainNetTransactions.unshift(message.trytes);
                }
            });
        this._devNetSubscriptionId = this._zmqDevNet.subscribe(
            "tx_trytes", async (evnt: string, message: ITxTrytes) => {
                if (!this._devNetTransactions.includes(message.trytes)) {
                    this._devNetTotal++;
                    this._devNetTransactions.unshift(message.trytes);
                }
            });
    }

    /**
     * Stop the zmq services.
     */
    private stopZmq(): void {
        this._mainNetTotal = 0;
        this._devNetTotal = 0;
        if (this._mainNetSubscriptionId) {
            this._zmqMainNet.unsubscribe(this._mainNetSubscriptionId);
            this._mainNetSubscriptionId = undefined;
        }
        if (this._devNetSubscriptionId) {
            this._zmqDevNet.unsubscribe(this._devNetSubscriptionId);
            this._devNetSubscriptionId = undefined;
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
