import axios from "axios";
import { ICurrenciesResponse } from "../models/api/ICurrenciesResponse";

/**
 * Class to handle api communications.
 */
export class ApiClient {
    /**
     * The endpoint for performing communications.
     */
    private readonly _endpoint: string;

    /**
     * Create a new instance of ApiClient.
     * @param endpoint The endpoint for the api.
     */
    constructor(endpoint: string) {
        this._endpoint = endpoint;
    }

    /**
     * Perform a request to get the currency information.
     * @param request The request to send.
     * @returns The response from the request.
     */
    public async currencies(): Promise<ICurrenciesResponse> {
        const ax = axios.create({ baseURL: this._endpoint });
        let response: ICurrenciesResponse;

        try {
            const axiosResponse = await ax.get<ICurrenciesResponse>(`currencies`);

            response = axiosResponse.data;
        } catch (err) {
            response = {
                success: false,
                message: `There was a problem communicating with the API.\n${err}`
            };
        }

        return response;
    }
}
