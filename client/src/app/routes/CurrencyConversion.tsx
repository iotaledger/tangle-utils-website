import { Fieldset, Form, Heading, Input, Select, StatusMessage } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IConfiguration } from "../../models/config/IConfiguration";
import { ApiClient } from "../../services/apiClient";
import { ConfigurationService } from "../../services/configurationService";
import { SettingsService } from "../../services/settingsService";
import { CurrencyConversionState } from "./CurrencyConversionState";

/**
 * Component for converting currency.
 */
class CurrencyConversion extends Component<any, CurrencyConversionState> {
    /**
     * Multipliers for IOTA conversion
     */
    private readonly MULTIPLIERS: { [id: string]: number } = {
        i: 1000000,
        k: 1000,
        m: 1,
        g: 1 / 1000,
        t: 1 / 1000000,
        p: 1 / 1000000000
    };

    /**
     * The network to use for transaction requests.
     */
    private readonly _settingsService: SettingsService;

    /**
     * The configuration.
     */
    private readonly _configuration: IConfiguration;

    /**
     * The api client.
     */
    private readonly _apiClient: ApiClient;

    /**
     * Create a new instance of CurrencyConversion.
     * @param props The props.
     */
    constructor(props: any) {
        super(props);

        this._configuration = ServiceFactory.get<ConfigurationService<IConfiguration>>("configuration").get();
        this._apiClient = new ApiClient(this._configuration.apiEndpoint);
        this._settingsService = ServiceFactory.get<SettingsService>("settings");

        this.state = {
            isBusy: false,
            isErrored: false,
            status: "",
            baseCurrencyRate: 0,
            currencies: [],
            fiatCode: "EUR",
            fiat: "",
            currencyIota: "",
            currencyKiota: "",
            currencyGiota: "",
            currencyMiota: "",
            currencyTiota: "",
            currencyPiota: ""
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this.setState(
            {
                isBusy: true,
                status: "Loading currency data, please wait...",
                isErrored: false
            },
            async () => {
                const hasData = await this.loadCurrencies();

                this.setState(
                    {
                        isBusy: false,
                        status: hasData ? "" : "Loading currency data failed, please try again later.",
                        isErrored: !hasData
                    });
            });
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <React.Fragment>
                {this.state.baseCurrencyRate === 0 && (
                    <StatusMessage status={this.state.status} isBusy={this.state.isBusy} color={this.state.isErrored ? "danger" : "info"} />
                )}

                {this.state.baseCurrencyRate > 0 && (
                    <React.Fragment>
                        <Heading level={1}>Currency Conversion</Heading>
                        <p>Fill in any of the fields to get automatic conversions at the current currency exchange rate.</p>
                        <Form>
                            <Fieldset>
                                <label>Fiat</label>
                                <Select
                                    value={this.state.fiatCode}
                                    onChange={(e) => this.fiatCodeConversion(e.target.value)}
                                    selectSize="small"
                                >
                                    {this.state.currencies.map(is => (
                                        <option key={is.id} value={is.id}>{is.id}</option>
                                    ))}
                                </Select>
                                <Input
                                    type="text"
                                    value={this.state.fiat}
                                    inputSize="small"
                                    placeholder="Enter amount in the selected currency"
                                    restrict="float"
                                    onChange={(e) => this.setState({ fiat: e.target.value }, () => this.fiatConversion())}
                                />
                            </Fieldset>
                            <Fieldset>
                                <label>Iotas (i)</label>
                                <Input
                                    type="text"
                                    value={this.state.currencyIota}
                                    inputSize="small"
                                    placeholder="Enter amount in iotas"
                                    maxLength={16}
                                    restrict="integer"
                                    onChange={(e) => this.setState({ currencyIota: e.target.value }, () => this.iotaConversion("i", this.state.currencyIota))}
                                />
                            </Fieldset>
                            <Fieldset>
                                <label>Kilo Iotas (Ki)</label>
                                <Input
                                    type="text"
                                    value={this.state.currencyKiota}
                                    inputSize="small"
                                    placeholder="Enter amount in Kilo Iotas"
                                    restrict="float"
                                    onChange={(e) => this.setState({ currencyKiota: e.target.value }, () => this.iotaConversion("k", this.state.currencyKiota))}
                                />
                            </Fieldset>
                            <Fieldset>
                                <label>Mega Iotas (Mi)</label>
                                <Input
                                    type="text"
                                    value={this.state.currencyMiota}
                                    inputSize="small"
                                    placeholder="Enter amount in Mega Iotas"
                                    restrict="float"
                                    onChange={(e) => this.setState({ currencyMiota: e.target.value }, () => this.iotaConversion("m", this.state.currencyMiota))}
                                />
                            </Fieldset>
                            <Fieldset>
                                <label>Giga Iotas (Gi)</label>
                                <Input
                                    type="text"
                                    value={this.state.currencyGiota}
                                    inputSize="small"
                                    placeholder="Enter amount in Giga Iotas"
                                    restrict="float"
                                    onChange={(e) => this.setState({ currencyGiota: e.target.value }, () => this.iotaConversion("g", this.state.currencyGiota))}
                                />
                            </Fieldset>
                            <Fieldset>
                                <label>Tera Iotas (Ti)</label>
                                <Input
                                    type="text"
                                    value={this.state.currencyTiota}
                                    inputSize="small"
                                    placeholder="Enter amount in Tera Iotas"
                                    restrict="float"
                                    onChange={(e) => this.setState({ currencyTiota: e.target.value }, () => this.iotaConversion("t", this.state.currencyTiota))}
                                />
                            </Fieldset>
                            <Fieldset>
                                <label>Peta Iotas (Pi)</label>
                                <Input
                                    type="text"
                                    value={this.state.currencyPiota}
                                    inputSize="small"
                                    placeholder="Enter amount in Peta Iotas"
                                    restrict="float"
                                    onChange={(e) => this.setState({ currencyPiota: e.target.value }, () => this.iotaConversion("p", this.state.currencyPiota))}
                                />
                            </Fieldset>
                        </Form>
                    </React.Fragment>
                )}
            </React.Fragment>
        );
    }

    /**
     * Load the currencies data.
     * @returns True if loaded successfully.
     */
    private async loadCurrencies(): Promise<boolean> {
        const settings = await this._settingsService.get();
        let hasData = false;

        // If we already have some data use that to begin with
        if (settings.baseCurrencyRate &&
            settings.baseCurrencyRate > 0 &&
            settings.currencies &&
            Object.keys(settings.currencies).length > 0) {
            hasData = true;
            this.setState({
                baseCurrencyRate: settings.baseCurrencyRate,
                currencies: settings.currencies,
                fiatCode: settings.fiatCode
            });
        }

        // If the data is missing then load it inline which can return errors
        // if the data is out of date try and get some new info in the background
        // if it fails we don't care about the outcome as we already have data
        const lastUpdate = settings ? (settings.lastCurrencyUpdate || 0) : 0;
        if (!hasData) {
            hasData = await this.loadData();
        } else if (Date.now() - lastUpdate > 3600000) {
            setTimeout(async () => this.loadData(), 0);
        }

        return hasData;
    }

    /**
     * Load new data from the endpoint.
     * @returns True if the load was succesful.
     */
    private async loadData(): Promise<boolean> {
        let hasData = false;

        try {
            const currencyResponse = await this._apiClient.currencies();
            if (currencyResponse && currencyResponse.success) {
                const settings = await this._settingsService.get();

                settings.lastCurrencyUpdate = Date.now();
                settings.baseCurrencyRate = currencyResponse.baseRate || 0;
                const cur = currencyResponse.currencies || {};
                const ids = Object.keys(cur).sort();
                settings.currencies = ids.map(i => ({ id: i, rate: cur[i] }));

                await this._settingsService.save();

                this.setState({
                    baseCurrencyRate: settings.baseCurrencyRate,
                    currencies: settings.currencies,
                    fiatCode: settings.fiatCode
                });

                hasData = true;
            }
        } catch (err) {
        }
        return hasData;
    }

    /**
     * Perform fiat conversion.
     */
    private fiatConversion(): void {
        const val = parseFloat(this.state.fiat);
        if (!isNaN(val)) {
            const selectedFiatToBase = this.state.currencies.find(c => c.id === this.state.fiatCode);

            if (selectedFiatToBase) {
                const miota = val / (selectedFiatToBase.rate * this.state.baseCurrencyRate);

                this.setState({
                    currencyIota: Math.round(miota * this.MULTIPLIERS.i).toFixed(0),
                    currencyKiota: (miota * this.MULTIPLIERS.k).toFixed(2),
                    currencyMiota: miota.toFixed(2),
                    currencyGiota: (miota * this.MULTIPLIERS.g).toFixed(2),
                    currencyTiota: (miota * this.MULTIPLIERS.t).toFixed(2),
                    currencyPiota: (miota * this.MULTIPLIERS.p).toFixed(2)
                });
            }
        }
    }

    /**
     * Perform fiat code conversion.
     * @param newFiatCode The new fiat code.
     */
    private fiatCodeConversion(newFiatCode: string): void {
        if (newFiatCode !== this.state.fiatCode) {
            const oldFiatToBase = this.state.currencies.find(c => c.id === this.state.fiatCode);
            const newFiatToBase = this.state.currencies.find(c => c.id === newFiatCode);

            if (oldFiatToBase && newFiatToBase) {
                const val = parseFloat(this.state.fiat);
                if (!isNaN(val)) {
                    const fiat = val / oldFiatToBase.rate * newFiatToBase.rate;
                    this.setState({ fiatCode: newFiatCode, fiat: fiat.toFixed(2) });
                }
            }
        }
    }

    /**
     * Perform iota conversion with a multiplier.
     * @param unit The unit to use as base value.
     * @param value The value to convert.
     */
    private iotaConversion(unit: string, value: string): void {
        const val = parseFloat(value);
        if (!isNaN(val)) {
            const selectedFiatToBase = this.state.currencies.find(c => c.id === this.state.fiatCode);

            if (selectedFiatToBase) {
                const miota = val / this.MULTIPLIERS[unit];
                const fiat = miota * (selectedFiatToBase.rate * this.state.baseCurrencyRate);

                this.setState({
                    fiat: fiat.toFixed(2),
                    currencyIota: unit === "i" ? value : Math.round(miota * this.MULTIPLIERS.i).toFixed(0),
                    currencyKiota: unit === "k" ? value : (miota * this.MULTIPLIERS.k).toFixed(2),
                    currencyMiota: unit === "m" ? value : miota.toFixed(2),
                    currencyGiota: unit === "g" ? value : (miota * this.MULTIPLIERS.g).toFixed(2),
                    currencyTiota: unit === "t" ? value : (miota * this.MULTIPLIERS.t).toFixed(2),
                    currencyPiota: unit === "p" ? value : (miota * this.MULTIPLIERS.p).toFixed(2)
                });
            }

        }
    }
}

export default CurrencyConversion;
