import axios from "axios";
import { IFindTransactionsRequest } from "../models/api/chronicle/IFindTransactionsRequest";
import { IFindTransactionsResponse } from "../models/api/chronicle/IFindTransactionsResponse";
import { IGetTrytesRequest } from "../models/api/chronicle/IGetTrytesRequest";
import { IGetTrytesResponse } from "../models/api/chronicle/IGetTrytesResponse";

/**
 * Class to handle api communications.
 */
export class ChronicleClient {
    /**
     * The endpoint for performing communications.
     */
    private readonly _endpoint: string;

    /**
     * Create a new instance of ChronicleClient.
     * @param endpoint The endpoint for the api.
     */
    constructor(endpoint: string) {
        this._endpoint = endpoint;
    }

    /**
     * Get the transaction objects for the requested hashes.
     * @param request The hashes to get the transaction objects for.
     * @returns The list of corresponding transaction objects.
     */
    public async getTrytes(request: IGetTrytesRequest): Promise<IGetTrytesResponse | undefined> {
        const ax = axios.create({ baseURL: this._endpoint });

        try {
            const axiosResponse = await ax.post<IGetTrytesResponse>(
                "",
                { ...{ command: "getTrytes" }, ...request },
                {
                    headers: {
                        "X-IOTA-API-Version": "1"
                    }
                }
            );

            if (axiosResponse.data && axiosResponse.data.trytes) {
                axiosResponse.data.trytes = axiosResponse.data.trytes.map(
                    (t, i) => ({ ...t, hash: request.hashes[i] })
                );
            }

            return axiosResponse.data;
        } catch (err) {
        }

        return undefined;
    }

    /**
     * Find the transaction for the given request object.
     * @param request The hashes to find the transaction hashes for.
     * @returns The list of found transaction hashes.
     */
    public async findTransactions(request: IFindTransactionsRequest): Promise<IFindTransactionsResponse | undefined> {
        const ax = axios.create({ baseURL: this._endpoint });

        try {
            const axiosResponse = await ax.post<IFindTransactionsResponse>(
                "",
                { ...{ command: "findTransactions" }, ...request },
                {
                    headers: {
                        "X-IOTA-API-Version": "1"
                    }
                }
            );

            return axiosResponse.data;
        } catch (err) {
        }

        return undefined;
    }

}
