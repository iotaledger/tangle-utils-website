import { composeAPI, Transaction } from "@iota/core";
import { mamFetch, MamMode } from "@iota/mam.js";
import { asTransactionObject, asTransactionObjects } from "@iota/transaction-converter";
import { ServiceFactory } from "../factories/serviceFactory";
import { FindTransactionsMode } from "../models/api/findTransactionsMode";
import { IConfiguration } from "../models/config/IConfiguration";
import { ConfirmationState } from "../models/confirmationState";
import { HashType } from "../models/hashType";
import { NetworkType } from "../models/services/networkType";
import { ApiClient } from "./apiClient";
import { ApiMamClient } from "./apiMamClient";

/**
 * Cache tangle requests.
 */
export class TangleCacheService {
    /**
     * Timeout for stale cached items (5 mins).
     */
    private readonly STALE_TIME: number = 300000;

    /**
     * The main configuration.
     */
    private readonly _configuration: IConfiguration;

    /**
     * The cache for the transactions.
     */
    private readonly _transactionCache: {
        /**
         * Network.
         */
        [id: string]: {
            /**
             * Transaction hash.
             */
            [id: string]: {
                /**
                 * The trytes for the transaction.
                 */
                trytes?: string;
                /**
                 * The confirmation state.
                 */
                confirmedState: ConfirmationState;
                /**
                 * The time of cache.
                 */
                cached: number;
                /**
                 * Did we manualy add this transaction.
                 */
                manual: boolean;
            }
        }
    };

    /**
     * Find transaction results.
     */
    private readonly _findCache: {
        /**
         * Network.
         */
        [id: string]: {
            /**
             * The hash type.
             */
            [id: string]: {

                /**
                 * The hash.
                 */
                [id: string]: {
                    /**
                     * The transactions hashes found.
                     */
                    transactionHashes: ReadonlyArray<string>;
                    /**
                     * The time of cache.
                     */
                    cached: number;
                }
            }
        }
    };

    /**
     * Address balance results.
     */
    private readonly _addressBalances: {
        /**
         * Network.
         */
        [id: string]: {
            /**
             * The address hash.
             */
            [id: string]: {
                /**
                 * The balance for the address.
                 */
                balance: number;
                /**
                 * The time of cache.
                 */
                cached: number;
            }
        }
    };

    /**
     * Mam payload cache.
     */
    private readonly _mam: {
        /**
         * Network.
         */
        [id: string]: {
            /**
             * The root.
             */
            [id: string]: {
                /**
                 * The payload.
                 */
                payload: string;
                /**
                 * The next root.
                 */
                nextRoot: string;
                /**
                 * The time of cache.
                 */
                cached: number;
            }
        }
    };

    /**
     * Create a new instance of TangleCacheService.
     * @param config The main configuration.
     */
    constructor(config: IConfiguration) {
        this._configuration = config;

        this._transactionCache = {
            mainnet: {},
            devnet: {}
        };

        this._findCache = {
            mainnet: {
                tag: {},
                address: {},
                bundle: {}
            },
            devnet: {
                tag: {},
                address: {},
                bundle: {}
            }
        };

        this._addressBalances = {
            mainnet: {},
            devnet: {}
        };

        this._mam = {
            mainnet: {},
            devnet: {}
        };

        // Check for stale cache items every minute
        setInterval(() => this.staleCheck(), 60000);
    }

    /**
     * Find transactions of the specified type.
     * @param hashType The type of hash to look for.
     * @param hash The type of hash to look for.
     * @param network Which network are we getting the transactions for.
     * @returns The transactions hashes returned from the looked up type.
     */
    public async findTransactionHashes(
        hashType: HashType, hash: string, network: NetworkType): Promise<ReadonlyArray<string>> {
        let transactionHashes: ReadonlyArray<string> = [];
        let doLookup = true;

        if (this._findCache[network][hashType][hash]) {
            // If the cache item was added less than a minute ago then use it.
            if (Date.now() - this._findCache[network][hashType][hash].cached < 60000) {
                doLookup = false;
                transactionHashes = this._findCache[network][hashType][hash].transactionHashes;
            }
        }

        if (doLookup) {
            const apiClient = ServiceFactory.get<ApiClient>("api-client");

            const response = await apiClient.findTransactions({
                network,
                hash,
                mode: hashType as FindTransactionsMode
            });

            if (response.success && response.hashes && response.hashes.length > 0) {
                transactionHashes = response.hashes;

                this._findCache[network][hashType][hash] = {
                    transactionHashes,
                    cached: Date.now()
                };
            }
        }

        return transactionHashes || [];
    }

    /**
     * Get transactions from the cache or from tangle if missing.
     * @param hashes The hashes of the transactions to get.
     * @param network Which network are we getting the transactions for.
     * @returns The trytes for the hashes.
     */
    public async getTransactions(hashes: ReadonlyArray<string>, network: NetworkType): Promise<ReadonlyArray<string>> {
        const now = Date.now();
        const unknownHashes = hashes.filter(h =>
            !this._transactionCache[network][h] ||
            this._transactionCache[network][h].trytes === undefined ||
            this._transactionCache[network][h].confirmedState === "unknown" ||
            now - this._transactionCache[network][h].cached > 60000);

        if (unknownHashes.length > 0) {
            try {
                const apiClient = ServiceFactory.get<ApiClient>("api-client");

                const response = await apiClient.getTrytes({
                    network,
                    hashes: unknownHashes
                });

                if (response &&
                    response.success &&
                    response.trytes &&
                    response.confirmationStates) {
                    for (let i = 0; i < response.trytes.length; i++) {
                        this._transactionCache[network][unknownHashes[i]] =
                            this._transactionCache[network][unknownHashes[i]] || {};
                        this._transactionCache[network][unknownHashes[i]].trytes =
                            response.trytes[i];
                        this._transactionCache[network][unknownHashes[i]].confirmedState =
                            response.confirmationStates[i];
                    }
                }
            } catch (err) {
            }
        }

        for (let i = 0; i < hashes.length; i++) {
            if (this._transactionCache[network][hashes[i]]) {
                this._transactionCache[network][hashes[i]].cached = now;
                this._transactionCache[network][hashes[i]].manual = false;
            }
        }

        return hashes.map(h => (
            this._transactionCache[network][h] && this._transactionCache[network][h].trytes) || "9".repeat(2673));
    }

    /**
     * Manually add transactions to the cache
     * @param hashes The hashes of the transactions to cache.
     * @param trytes The trytes of the transactions to cache.
     * @param network Which network are we getting the transactions for.
     */
    public addTransactions(hashes: ReadonlyArray<string>, trytes: ReadonlyArray<string>, network: NetworkType): void {
        const now = Date.now();

        for (let i = 0; i < hashes.length; i++) {
            this._transactionCache[network][hashes[i]] = {
                trytes: trytes[i],
                cached: now,
                confirmedState: "unknown",
                manual: true
            };
        }
    }

    /**
     * Manually remove transactions from the cache
     * @param hashes The hashes of the transactions to cache.
     * @param network Which network are we getting the transactions for.
     */
    public removeTransactions(hashes: ReadonlyArray<string>, network: NetworkType): void {
        for (let i = 0; i < hashes.length; i++) {
            if (this._transactionCache[network][hashes[i]] && this._transactionCache[network][hashes[i]].manual) {
                delete this._transactionCache[network][hashes[i]];
            }
        }
    }

    /**
     * Get the include state for the transaction.
     * @param hashes The hashes to get the inclusion state.
     * @param network Which network are we getting the transactions for.
     * @returns The confirmation states for the transactions.
     */
    public async getTransactionConfirmationStates(
        hashes: ReadonlyArray<string>, network: NetworkType): Promise<ReadonlyArray<ConfirmationState>> {
        const now = Date.now();
        const unknownStates = hashes.filter(h =>
            !this._transactionCache[network][h] ||
            this._transactionCache[network][h].confirmedState === "unknown" ||
            now - this._transactionCache[network][h].cached > 15000);

        if (unknownStates.length > 0) {
            await this.getTransactions(unknownStates, network);
        }

        return hashes.map(h =>
            this._transactionCache[network] &&
                this._transactionCache[network][h] ?
                this._transactionCache[network][h].confirmedState : "unknown");
    }

    /**
     * Get the transaction groups in the bundle.
     * @param transactionHashes The transaction hashes in the bundle.
     * @param network Which network are we getting the transactions for.
     * @returns The grouped transactions in the bundle.
     */
    public async getBundleGroups(
        transactionHashes: ReadonlyArray<string>,
        network: NetworkType): Promise<ReadonlyArray<ReadonlyArray<Transaction>>> {
        const transactions = await this.getTransactions(transactionHashes, network);

        const transactionObjects = asTransactionObjects(transactionHashes)(transactions);

        const byHash: { [id: string]: Transaction } = {};
        const bundleGroups: Transaction[][] = [];

        const trunkTransactions = [];

        for (let i = 0; i < transactionObjects.length; i++) {
            byHash[transactionObjects[i].hash] = transactionObjects[i];
            if (transactionObjects[i].currentIndex === 0) {
                bundleGroups.push([transactionObjects[i]]);
            }
        }

        for (let i = 0; i < bundleGroups.length; i++) {
            let trunk = bundleGroups[i][0].trunkTransaction;
            trunkTransactions.push(trunk);
            const txCount = bundleGroups[i][0].lastIndex;
            for (let j = 0; j < txCount; j++) {
                const tx = byHash[trunk];
                if (!tx) {
                    break;
                }
                bundleGroups[i].push(tx);
                trunk = tx.trunkTransaction;
            }
        }

        return bundleGroups;
    }

    /**
     * Get the balance for an address.
     * @param addressHash The addresss hash to get the balance.
     * @param network Which network are we getting the transactions for.
     * @returns The balance for the address.
     */
    public async getAddressBalance(addressHash: string, network: NetworkType): Promise<number> {
        const now = Date.now();

        if (!this._addressBalances[network][addressHash] ||
            now - this._addressBalances[network][addressHash].balance > 30000) {
            try {
                const nodeConfig = network === "mainnet"
                    ? this._configuration.nodeMainnet : this._configuration.nodeDevnet;

                const api = composeAPI({
                    provider: nodeConfig.provider
                });

                const response = await api.getBalances([addressHash], 100);
                if (response && response.balances) {
                    let balance = 0;
                    for (let i = 0; i < response.balances.length; i++) {
                        balance += response.balances[i];
                    }
                    this._addressBalances[network][addressHash] = {
                        balance,
                        cached: now
                    };
                }
            } catch (err) {
                console.error(err);
            }
        }

        return this._addressBalances[network][addressHash] ? this._addressBalances[network][addressHash].balance : 0;
    }

    /**
     * Get the payload at the given mam root.
     * @param root The mam root.
     * @param mode The mode for the mam fetch.
     * @param key The key for the mam fetch if restricted mode.
     * @param network Which network are we getting the transactions for.
     * @returns The balance for the address.
     */
    public async getMamPacket(root: string, mode: MamMode, key: string, network: NetworkType): Promise<{
        /**
         * The payload at the given root.
         */
        payload: string;
        /**
         * The next root.
         */
        nextRoot: string;
    } | undefined> {
        if (!this._mam[network][root]) {
            try {
                const api = new ApiMamClient(this._configuration.apiEndpoint, network);

                const result = await mamFetch(api as any, root, mode, key);

                if (result) {
                    this._mam[network][root] = {
                        payload: result.message,
                        nextRoot: result.nextRoot,
                        cached: Date.now()
                    };
                }
            } catch (err) {
                console.error(err);
            }
        }

        return this._mam[network][root];
    }

    /**
     * Get all the transaction within the transaction bundle group.
     * @param transaction The transaction to use as the starting point.
     * @param network The network to communicate with.
     * @returns The transactions bundle group.
     */
    public async getTransactionBundleGroup(
        transaction: Transaction, network: NetworkType): Promise<ReadonlyArray<Transaction>> {
        let thisGroup: Transaction[] = [];
        if (transaction.lastIndex === 0) {
            thisGroup = [transaction];
        } else if (transaction.currentIndex === 0) {
            // If this current index then we can just traverse the tree
            // to get the other transactions in this bundle group
            let trunk = transaction.trunkTransaction;
            thisGroup = [transaction];
            for (let i = 1; i <= transaction.lastIndex; i++) {
                const txs = await this.getTransactions([trunk], network);
                if (txs && txs.length > 0) {
                    const txo = asTransactionObject(txs[0]);
                    thisGroup.push(txo);
                    trunk = txo.trunkTransaction;
                }
            }
        } else {
            // Otherwise we have to grab the whole bundle.
            // and find which group this transaction is in
            const bundleTransactionsHashes = await this.findTransactionHashes("bundle", transaction.bundle, network);
            if (bundleTransactionsHashes.length > 0) {
                const bundleGroups = await this.getBundleGroups(bundleTransactionsHashes, network);

                const bg = bundleGroups.find(group => group.findIndex(t => t.hash === transaction.hash) >= 0);
                if (bg) {
                    thisGroup = Array.from(bg);
                }
            }
        }
        return thisGroup;
    }

    /**
     * Check all the cached items and remove any stale items.
     */
    private staleCheck(): void {
        const now = Date.now();

        for (const net in this._transactionCache) {
            for (const tx in this._transactionCache[net]) {
                if (now - this._transactionCache[net][tx].cached >= this.STALE_TIME) {
                    delete this._transactionCache[net][tx];
                }
            }
        }

        for (const net in this._findCache) {
            for (const hashType in this._findCache[net]) {
                for (const hash in this._findCache[net][hashType]) {
                    if (now - this._findCache[net][hashType][hash].cached >= this.STALE_TIME) {
                        delete this._findCache[net][hashType][hash];
                    }
                }
            }
        }

        for (const net in this._addressBalances) {
            for (const address in this._addressBalances[net]) {
                if (now - this._addressBalances[net][address].cached >= this.STALE_TIME) {
                    delete this._addressBalances[net][address];
                }
            }
        }

        for (const net in this._mam) {
            for (const root in this._mam[net]) {
                if (now - this._mam[net][root].cached >= this.STALE_TIME) {
                    delete this._mam[net][root];
                }
            }
        }
    }
}
