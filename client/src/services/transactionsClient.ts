import SocketIOClient from "socket.io-client";
import { IResponse } from "../models/api/IResponse";
import { ITransactionsSubscribeResponse } from "../models/api/ITransactionsSubscribeResponse";
import { ITransactionsSubscriptionMessage } from "../models/api/ITransactionsSubscriptionMessage";
import { ITransactionsUnsubscribeRequest } from "../models/api/ITransactionsUnsubscribeRequest";
import { INetworkConfiguration } from "../models/config/INetworkConfiguration";
import { Network } from "../models/network";

/**
 * Class to handle api communications.
 */
export class TransactionsClient {
    /**
     * The endpoint for performing communications.
     */
    private readonly _endpoint: string;

    /**
     * Network configurations.
     */
    private readonly _networkConfigurations: INetworkConfiguration[];

    /**
     * The web socket to communicate on.
     */
    private readonly _socket: SocketIOClient.Socket;

    /**
     * The latest transactions.
     */
    private readonly _transactions: {
        [key in Network]?: {
            /**
             * The tx hash.
             */
            hash: string;
            /**
             * The tx value.
             */
            value: number
        }[]
    };

    /**
     * The tps.
     */
    private _tps: {
        [key in Network]?: number[]
    };

    /**
     * The tps interval.
     */
    private _tspInterval: number;

    /**
     * Create a new instance of TransactionsClient.
     * @param endpoint The endpoint for the api.
     * @param networkConfigurations The network configurations.
     */
    constructor(endpoint: string, networkConfigurations: INetworkConfiguration[]) {
        this._endpoint = endpoint;
        this._networkConfigurations = networkConfigurations;

        this._socket = SocketIOClient(this._endpoint);
        this._transactions = {};
        this._tps = {};
        this._tspInterval = 1;

        for (const networkConfig of this._networkConfigurations) {
            this._transactions[networkConfig.network] = [];
            this._tps[networkConfig.network] = [];
        }
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
                    this._tps = transactionsResponse.tps;
                    this._tspInterval = transactionsResponse.tpsInterval;

                    for (const networkConfig of this._networkConfigurations) {
                        const networkTrans = this._transactions[networkConfig.network];

                        if (networkTrans) {
                            const newHashes = transactionsResponse.transactions[networkConfig.network];
                            if (newHashes) {
                                const newHashKeys = Object.keys(newHashes);
                                for (const newHashKey of newHashKeys) {
                                    if (networkTrans.findIndex(t => t.hash === newHashKey) === -1) {
                                        networkTrans.unshift({
                                            hash: newHashKey,
                                            value: newHashes[newHashKey]
                                        });
                                    }
                                }

                                if (networkTrans.length > 200) {
                                    networkTrans.splice(200, networkTrans.length - 200);
                                }
                            }
                        }
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
     * Get the transactions as trytes.
     * @param network The network the get the transactions.
     * @returns The trytes.
     */
    public getTransactions(network: Network): {
        /**
         * The tx hash.
         */
        hash: string;
        /**
         * The tx value.
         */
        value: number
    }[] {
        return this._transactions[network] || [];
    }

    /**
     * Calculate the tps.
     * @param network The network to get the tps for.
     * @returns The tps.
     */
    public getTps(network: Network): number {
        const tps = this._tps[network];
        if (tps && tps.length > 0) {
            const oneMinuteCount = Math.min(60 / this._tspInterval, tps.length);
            const total = tps.slice(0, oneMinuteCount).reduce((a, b) => a + b, 0);
            return total / oneMinuteCount / this._tspInterval;
        }
        return -1;
    }
}
