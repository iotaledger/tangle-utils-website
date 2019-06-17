import { ICurrenciesResponse } from "../../models/api/ICurrenciesResponse";
import { IConfiguration } from "../../models/IConfiguration";
import { StateService } from "../../services/stateService";

/**
 * Get the list of currencies and exchange rates.
 * @param config The configuration.
 * @param request the request.
 * @returns The response.
 */
export async function get(config: IConfiguration, request: any): Promise<ICurrenciesResponse> {
    try {
        const stateService = new StateService(config.dynamoDbConnection);

        const state = await stateService.get("default");

        if (!state) {
            throw new Error("Unable to get currency data.");
        }

        return {
            success: true,
            message: "OK",
            baseRate: state.coinMarketCapRateEUR,
            currencies: state.exchangeRatesEUR
        };
    } catch (err) {
        return {
            success: false,
            message: err.toString()
        };
    }
}
