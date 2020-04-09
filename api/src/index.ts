import { Server } from "http";
import SocketIO from "socket.io";
import { ServiceFactory } from "./factories/serviceFactory";
import { IRoute } from "./models/app/IRoute";
import { ISchedule } from "./models/app/ISchedule";
import { transactionsSubscribe } from "./routes/transactions/transactionsSubscribe";
import { transactionsUnsubscribe } from "./routes/transactions/transactionsUnsubscribe";
import { MilestonesService } from "./services/milestonesService";
import { MilestoneStoreService } from "./services/milestoneStoreService";
import { StateService } from "./services/stateService";
import { TransactionsService } from "./services/transactionsService";
import { ZmqService } from "./services/zmqService";
import { AppHelper } from "./utils/appHelper";
import { ScheduleHelper } from "./utils/scheduleHelper";

const routes: IRoute[] = [
    { path: "/init", method: "get", func: "init" },
    { path: "/currencies", method: "get", folder: "currency", func: "get" },
    { path: "/find-transactions", method: "get", folder: "tangle", func: "findTransactions" },
    { path: "/get-trytes", method: "post", folder: "tangle", func: "getTrytes" },
    { path: "/get-milestones/:network", method: "get", folder: "tangle", func: "getMilestones" }
];

AppHelper.build(
    routes,
    async (app, config, port) => {
        const milestonesService = new MilestonesService(config.networks);
        const transactionService = new TransactionsService(config.networks);

        for (const networkConfig of config.networks) {
            if (networkConfig.zmqEndpoint) {
                ServiceFactory.register(
                    `zmq-${networkConfig.network}`,
                    () => new ZmqService(networkConfig.zmqEndpoint)
                );
            }
        }
        ServiceFactory.register("transactions", () => transactionService);
        ServiceFactory.register("milestones", () => milestonesService);

        if (config.dynamoDbConnection) {
            ServiceFactory.register("milestone-store", () => new MilestoneStoreService(config.dynamoDbConnection));
        }

        const server = new Server(app);
        const socketServer = SocketIO(server);
        server.listen(port);
        socketServer.on("connection", socket => {
            socket.on("subscribe", data => socket.emit("subscribe", transactionsSubscribe(config, socket)));
            socket.on("unsubscribe", data => socket.emit("unsubscribe", transactionsUnsubscribe(config, socket, data)));
        });

        await milestonesService.init();
        await transactionService.init();

        // Only perform currency lookups if api keys have been supplied
        if (config.dynamoDbConnection &&
            (config.cmcApiKey || "CMC_API_KEY") !== "CMC_API_KEY" &&
            (config.fixerApiKey || "FIXER_API_KEY") !== "FIXER_API_KEY") {

            const schedules: ISchedule[] = [
                {
                    name: "Update Currencies",
                    schedule: "* 0/4 * * * *", // Every 4 hours on 0 minute
                    func: async () => {
                        const stateService = new StateService(config.dynamoDbConnection);

                        await stateService.updateCurrencies(config);
                    }
                }
            ];

            await ScheduleHelper.build(schedules);
        }
    },
    true);
