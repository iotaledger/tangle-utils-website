import { composeAPI } from "@iota/core";
import { ChronicleClient } from "../../clients/chronicleClient";
import { IFindTransactionsRequest } from "../../models/api/IFindTransactionsRequest";
import { IFindTransactionsResponse } from "../../models/api/IFindTransactionsResponse";
import { IConfiguration } from "../../models/configuration/IConfiguration";

/**
 * Find transactions hashes on a network.
 * @param config The configuration.
 * @param request The request.
 * @returns The response.
 */
export async function findTransactions(config: IConfiguration, request: IFindTransactionsRequest)
    : Promise<IFindTransactionsResponse> {

    let hashes: string[];

    const findReq = request.mode === "tag"
        ? { tags: [request.hash] } : request.mode === "address"
            ? { addresses: [request.hash] }
            : { bundles: [request.hash] };

    try {
        const nodeConfig = request.network === "mainnet"
            ? config.nodeMainnet : config.nodeDevnet;

        console.log("findTransactions", request.network);

        const api = composeAPI({
            provider: nodeConfig.provider
        });

        hashes = await api.findTransactions(findReq);
    } catch (err) {
        console.error("Error", err);
    }

    if ((!hashes || hashes.length === 0) &&
        request.network === "mainnet" &&
        config.permaNodeEndpoint) {
        try {
            const chronicleClient = new ChronicleClient(config.permaNodeEndpoint);
            const response = await chronicleClient.findTransactions(findReq);
            hashes = response.hashes;
        } catch { }
    }

    return {
        success: true,
        message: "OK",
        hashes: (hashes || []).slice(0, 100),
        totalCount: hashes ? hashes.length : 0
    };
}
