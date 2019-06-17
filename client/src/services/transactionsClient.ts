import { asTransactionObject, Transaction } from "@iota/transaction-converter";
import SocketIOClient from "socket.io-client";
import { IResponse } from "../models/api/IResponse";
import { ITransactionsSubscribeResponse } from "../models/api/ITransactionsSubscribeResponse";
import { ITransactionsSubscriptionMessage } from "../models/api/ITransactionsSubscriptionMessage";
import { ITransactionsUnsubscribeRequest } from "../models/api/ITransactionsUnsubscribeRequest";

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
     * Create a new instance of ApiClient.
     * @param endpoint The endpoint for the api.
     */
    constructor(endpoint: string) {
        this._endpoint = endpoint;

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
                    this._mainnetTransactions = transactionsResponse.mainnetTransactions
                        .map(trytes => asTransactionObject(trytes, undefined))
                        .concat(this._mainnetTransactions)
                        .slice(0, 200);
                    this._devnetTransactions = transactionsResponse.devnetTransactions
                        .map(trytes => asTransactionObject(trytes, undefined))
                        .concat(this._devnetTransactions)
                        .slice(0, 200);
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
