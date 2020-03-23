import { Transaction, Transfer } from "@iota/core";
import { ChronicleClient } from "./chronicleClient";

/**
 * Class to handle api communications to chronicle permanode for mam.
 */
export class ChronicleMamClient {
    /**
     * The base chronicle client.
     */
    private readonly _chronicleClient: ChronicleClient;

    /**
     * Create a new instance of ChronicleClient.
     * @param endpoint The endpoint for the api.
     */
    constructor(endpoint: string) {
        this._chronicleClient = new ChronicleClient(endpoint);
    }

    /**
     * Prepare transfers for sending.
     * @param seed The seed to use for preparing the transfers.
     * @param transfers The transfers.
     * @param options The transfer options.
     */
    public async prepareTransfers(
        seed: string | Int8Array,
        transfers: ReadonlyArray<Transfer>,
        options?: Partial<any>): Promise<ReadonlyArray<string>> {
        throw new Error("This method is not supported by Chronicle");
    }

    /**
     * Send trytes to the node.
     * @param trytes The trytes to send.
     * @param depth The depth to send the trytes.
     * @param minWeightMagnitude The mwm to send the trytes.
     * @param reference The reference transaction.
     * @returns The list of corresponding transaction objects.
     */
    public async sendTrytes(
        trytes: ReadonlyArray<string>,
        depth: number,
        minWeightMagnitude: number,
        reference?: string | undefined): Promise<ReadonlyArray<Transaction>> {
        throw new Error("This method is not supported by Chronicle");
    }

    /**
     * Find the transaction objects for the given request hashes.
     * @param request The hashes to find the transaction hashes for.
     * @returns The list of found transaction hashes.
     */
    public async findTransactionObjects(request: {
        /**
         * List of address hashes.
         */
        addresses?: ReadonlyArray<string>,
        /**
         * List of bundle hashes.
         */
        approvees?: ReadonlyArray<string>,
        /**
         * List of bundle hashes.
         */
        bundles?: ReadonlyArray<string>,
        /**
         * List of tags.
         */
        tags?: ReadonlyArray<string>
    }): Promise<ReadonlyArray<Transaction>> {
        const response = await this._chronicleClient.findTransactions(request);
        let txs: Transaction[] = [];

        if (response && response.hashes) {
            const trytesResponse = await this._chronicleClient.getTrytes({
                hashes: response.hashes
            });

            if (trytesResponse && trytesResponse.trytes) {
                txs = trytesResponse.trytes.map(t => t);
            }
        }

        return txs;
    }
}
