import { IResponse } from "./IResponse";

export interface IFindTransactionsResponse extends IResponse {
    /**
     * The hashes for the matching transaction.
     */
    hashes?: string[];
}
