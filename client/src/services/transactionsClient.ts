import SocketIOClient from "socket.io-client";
import { ServiceFactory } from "../factories/serviceFactory";
import { IResponse } from "../models/api/IResponse";
import { ITransactionsSubscribeResponse } from "../models/api/ITransactionsSubscribeResponse";
import { ITransactionsSubscriptionMessage } from "../models/api/ITransactionsSubscriptionMessage";
import { ITransactionsUnsubscribeRequest } from "../models/api/ITransactionsUnsubscribeRequest";
import { TangleCacheService } from "./tangleCacheService";

/**
 * Class to handle api communications.
 */
export class TransactionsClient {
    /**
     * The endpoint for performing communications.
     */
    private readonly _endpoint: string;

    /**
     * The web socket to communicate on.
     */
    private readonly _socket: SocketIOClient.Socket;

    /**
     * The latest transactions for mainnet.
     */
    private _mainnetTransactions: {
        /**
         * The tx hash.
         */
        hash: string;
        /**
         * The tx value.
         */
        value: number
    }[];

    /**
     * The latest transactions for devnet.
     */
    private _devnetTransactions: {
        /**
         * The tx hash.
         */
        hash: string;
        /**
         * The tx value.
         */
        value: number
    }[];

    /**
     * The mainnet tps.
     */
    private _mainnetTps: number[];

    /**
     * The devnet tps.
     */
    private _devnetTps: number[];

    /**
     * The tps interval.
     */
    private _tspInterval: number;

    /**
     * The tangle cache service.
     */
    private readonly _tangleCacheService: TangleCacheService;

    /**
     * Create a new instance of TransactionsClient.
     * @param endpoint The endpoint for the api.
     */
    constructor(endpoint: string) {
        this._endpoint = endpoint;

        this._tangleCacheService = ServiceFactory.get<TangleCacheService>("tangle-cache");

        this._socket = SocketIOClient(this._endpoint);
        this._mainnetTransactions = [];
        this._devnetTransactions = [];
        this._mainnetTps = [];
        this._devnetTps = [];
        this._tspInterval = 1;
    }

    /**
     * Perform a request to subscribe to transactions events.
     * @param callback Callback called with transactions data.
     * @returns The response from the request.
     */
    public async subscribe(callback: () => void): Promise<ITransactionsSubscribeResponse> {
        return new Promise<ITransactionsSubscribeResponse>((resolve, reject) => {
            try {
                this._socket.emit("subscribe");
                this._socket.on("subscribe", (subscribeResponse: ITransactionsSubscribeResponse) => {
                    resolve(subscribeResponse);
                });
                this._socket.on("transactions", (transactionsResponse: ITransactionsSubscriptionMessage) => {
                    this._mainnetTps = transactionsResponse.mainnetTps;
                    this._devnetTps = transactionsResponse.devnetTps;
                    this._tspInterval = transactionsResponse.tpsInterval;

                    const newMainNet = [];
                    const newDevNet = [];

                    const mainHashes = Object.keys(transactionsResponse.mainnetTransactions);
                    for (const mainHash of mainHashes) {
                        if (this._mainnetTransactions.findIndex(t => t.hash === mainHash) === -1) {
                            newMainNet.push({
                                hash: mainHash,
                                value: transactionsResponse.mainnetTransactions[mainHash]
                            });
                        }
                    }

                    const devHashes = Object.keys(transactionsResponse.devnetTransactions);
                    for (const devHash of devHashes) {
                        if (this._devnetTransactions.findIndex(t => t.hash === devHash) === -1) {
                            newDevNet.push({
                                hash: devHash,
                                value: transactionsResponse.devnetTransactions[devHash]
                            });
                        }
                    }

                    this._mainnetTransactions = newMainNet.concat(this._mainnetTransactions);
                    this._devnetTransactions = newDevNet.concat(this._devnetTransactions);

                    if (this._mainnetTransactions.length > 200) {
                        this._mainnetTransactions.splice(200, this._mainnetTransactions.length - 200);
                    }
                    if (this._devnetTransactions.length > 200) {
                        this._devnetTransactions.splice(200, this._devnetTransactions.length - 200);
                    }
                    callback();
                });
            } catch (err) {
                resolve({
                    success: false,
                    message: `There was a problem communicating with the API.\n${err}`
                });
            }
        });
    }

    /**
     * Perform a request to unsubscribe to transactions events.
     * @param request The request to send.
     * @returns The response from the request.
     */
    public async unsubscribe(request: ITransactionsUnsubscribeRequest): Promise<IResponse> {
        return new Promise<IResponse>((resolve, reject) => {
            try {
                this._socket.emit("unsubscribe", request);
                this._socket.on("unsubscribe", (subscribeResponse: IResponse) => {
                    resolve(subscribeResponse);
                });
            } catch (err) {
                resolve({
                    success: false,
                    message: `There was a problem communicating with the API.\n${err}`
                });
            }
        });
    }

    /**
     * Get the main net transactions as trytes.
     * @returns The trytes.
     */
    public getMainNetTransactions(): {
        /**
         * The tx hash.
         */
        hash: string;
        /**
         * The tx value.
         */
        value: number
    }[] {
        return this._mainnetTransactions;
    }

    /**
     * Get the dev net transactions as trytes.
     * @returns The trytes.
     */
    public getDevNetTransactions(): {
        /**
         * The tx hash.
         */
        hash: string;
        /**
         * The tx value.
         */
        value: number
    }[] {
        return this._devnetTransactions;
    }

    /**
     * Calculate the main net tps.
     * @returns The tps.
     */
    public getMainNetTps(): number {
        if (this._mainnetTps.length > 0) {
            const oneMinuteCount = Math.min(60 / this._tspInterval, this._mainnetTps.length);
            const total = this._mainnetTps.slice(0, oneMinuteCount).reduce((a, b) => a + b, 0);
            return total / oneMinuteCount / this._tspInterval;
        } else {
            return -1;
        }
    }

    /**
     * Calculate the dev net tps.
     * @returns The tps.
     */
    public getDevNetTps(): number {
        if (this._devnetTps.length > 0) {
            const oneMinuteCount = Math.min(60 / this._tspInterval, this._devnetTps.length);
            const total = this._devnetTps.slice(0, oneMinuteCount).reduce((a, b) => a + b, 0);
            return total / oneMinuteCount / this._tspInterval;
        } else {
            return -1;
        }
    }
}
