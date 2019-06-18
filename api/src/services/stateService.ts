import { CoinMarketCapClient } from "../clients/coinMarketCapClient";
import { FixerClient } from "../clients/fixerClient";
import { IState } from "../models/db/IState";
import { IAWSDynamoDbConfiguration } from "../models/IAWSDynamoDbConfiguration";
import { IConfiguration } from "../models/IConfiguration";
import { AmazonDynamoDbService } from "./amazonDynamoDbService";

/**
 * Service to handle the state.
 */
export class StateService extends AmazonDynamoDbService<IState> {
    /**
     * The name of the database table.
     */
    public static readonly TABLE_NAME: string = "state";

    constructor(config: IAWSDynamoDbConfiguration) {
        super(config, StateService.TABLE_NAME, "id");
    }

    /**
     * Update the stored currencies.
     * @param config The configuration.
     * @returns Log of operations.
     */
    public async updateCurrencies(config: IConfiguration): Promise<string> {
        let currentState;
        let log = "Currency Update\n";
        try {
            const stateService = new StateService(config.dynamoDbConnection);
            const now = Date.now();
            currentState = (await stateService.get("default")) || { id: "default" };
            if (!currentState ||
                currentState.lastCurrencyUpdate === undefined ||
                now - currentState.lastCurrencyUpdate > 3600000) { // every hour
                let updated = false;

                log += `Updating fixer ${config.fixerApiKey}\n`;

                const fixerClient = new FixerClient(config.fixerApiKey);
                const rates = await fixerClient.latest("EUR");

                log += `Rates ${JSON.stringify(rates)}\n`;

                if (rates) {
                    currentState.exchangeRatesEUR = rates;
                    updated = true;
                }

                log += `CMC ${config.cmcApiKey}\n`;

                const coinMarketCapClient = new CoinMarketCapClient(config.cmcApiKey);

                const currency = await coinMarketCapClient.quotesLatest("1720", "EUR");
                log += `Currency ${JSON.stringify(currency)}\n`;

                if (currency && currency.quote && currency.quote.EUR) {
                    currentState.coinMarketCapRateEUR = currency.quote.EUR.price;
                    updated = true;
                }

                if (updated) {
                    currentState.lastCurrencyUpdate = now;
                    await this.set(currentState);
                }
            } else {
                log += "No update required\n";
            }
        } catch (err) {
            log += `Error updating currencies ${err.toString()}\n`;
        }
        return log;
    }
}
