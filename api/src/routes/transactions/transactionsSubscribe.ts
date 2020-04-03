import SocketIO from "socket.io";
import { ServiceFactory } from "../../factories/serviceFactory";
import { ITransactionsSubscribeResponse } from "../../models/api/ITransactionsSubscribeResponse";
import { IConfiguration } from "../../models/configuration/IConfiguration";
import { TransactionsService } from "../../services/transactionsService";

/**
 * Subscribe to transactions events.
 * @param config The configuration.
 * @param socket The websocket.
 * @param request The request.
 * @returns The response.
 */
export function transactionsSubscribe(config: IConfiguration, socket: SocketIO.Socket): ITransactionsSubscribeResponse {
    let response: ITransactionsSubscribeResponse;

    try {
        const transactionsService = ServiceFactory.get<TransactionsService>("transactions");

        const subscriptionId = transactionsService.subscribe(transactionData => {
            socket.emit("transactions", transactionData);
        });

        response = {
            success: true,
            message: "",
            subscriptionId
        };
    } catch (err) {
        response = {
            success: false,
            message: err.toString()
        };
    }

    return response;
}
