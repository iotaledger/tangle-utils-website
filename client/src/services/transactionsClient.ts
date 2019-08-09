import { asTransactionObject, Transaction } from "@iota/transaction-converter";
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
    private _mainnetTransactions: Transaction[];

    /**
     * The latest transactions for devnet.
     */
    private _devnetTransactions: Transaction[];

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
                    let newMainNet = transactionsResponse.mainnetTransactions.map(
                        trytes => asTransactionObject(trytes, undefined));
                    let newDevNet = transactionsResponse.devnetTransactions.map(
                        trytes => asTransactionObject(trytes, undefined));

                    newMainNet = newMainNet.filter(tx =>
                        this._mainnetTransactions.findIndex(tx2 => tx2.hash === tx.hash) === -1);
                    newDevNet = newDevNet.filter(tx =>
                        this._devnetTransactions.findIndex(tx2 => tx2.hash === tx.hash) === -1);

                    this._tangleCacheService.addTransactions(
                        newMainNet.map(tx => tx.hash), transactionsResponse.mainnetTransactions, "mainnet");

                    this._tangleCacheService.addTransactions(
                        newDevNet.map(tx => tx.hash), transactionsResponse.devnetTransactions, "devnet");

                    this._mainnetTransactions = newMainNet.concat(this._mainnetTransactions);
                    this._devnetTransactions = newDevNet.concat(this._devnetTransactions);

                    if (this._mainnetTransactions.length > 200) {
                        const toRemove = this._mainnetTransactions.splice(200, this._mainnetTransactions.length - 200);
                        this._tangleCacheService.removeTransactions(toRemove.map(tx => tx.hash), "mainnet");
                    }
                    if (this._devnetTransactions.length > 200) {
                        const toRemove = this._devnetTransactions.splice(200, this._devnetTransactions.length - 200);
                        this._tangleCacheService.removeTransactions(toRemove.map(tx => tx.hash), "devnet");
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
    public getMainNetTransactions(): Transaction[] {
        return this._mainnetTransactions;
    }

    /**
     * Get the dev net transactions as trytes.
     * @returns The trytes.
     */
    public getDevNetTransactions(): Transaction[] {
        return this._devnetTransactions;
    }
}
