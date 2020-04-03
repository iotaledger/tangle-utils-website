import { Select } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../factories/serviceFactory";
import { CurrencyService } from "../../services/currencyService";
import "./InlineCurrency.scss";
import { InlineCurrencyProps } from "./InlineCurrencyProps";
import { InlineCurrencyState } from "./InlineCurrencyState";

/**
 * Component which will display a transaction.
 */
class InlineCurrency extends Component<InlineCurrencyProps, InlineCurrencyState> {
    /**
     * The service to use for currency conversion.
     */
    private readonly _currencyService: CurrencyService;

    /**
     * Is the component mounted.
     */
    private _mounted: boolean;

    /**
     * Create a new instance of InlineCurrency.
     * @param props The props.
     */
    constructor(props: InlineCurrencyProps) {
        super(props);

        this._currencyService = ServiceFactory.get<CurrencyService>("currency");
        this._mounted = false;

        this.state = {
            currencies: []
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

        await this.calculateCurrency(this.props.valueIota);
    }

    /**
     * The component performed an update.
     * @param prevProps The previous properties.
     */
    public async componentDidUpdate(prevProps: InlineCurrencyProps): Promise<void> {
        if (prevProps.valueIota !== this.props.valueIota) {
            await this.calculateCurrency(this.props.valueIota);
        }
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return this.state.currencies && this.state.currencies.length > 0 && (
            <div className="inline-currency">
                <Select
                    value={this.state.fiatCode}
                    onChange={e => this.setState({ fiatCode: e.target.value }, async () => {
                        if (this._mounted) {
                            this.setState(
                                {
                                    valueConverted:
                                        await this._currencyService.currencyConvert(
                                            this.props.valueIota,
                                            {
                                                fiatCode: this.state.fiatCode || "EUR",
                                                currencies: this.state.currencies,
                                                baseCurrencyRate:
                                                    this.state.baseCurrencyRate
                                            },
                                            true)
                                });
                        }
                    }
                    )}
                    selectSize="small"
                >
                    {this.state.currencies.map(is => (
                        <option key={is.id} value={is.id}>{is.id}</option>
                    ))}
                </Select>
                <span className="currency">{this.state.valueConverted}</span>
            </div>
        );

    }

    /**
     * Calculate the currency display.
     * @param valueIota The iota value to display.
     */
    private async calculateCurrency(valueIota: number): Promise<void> {
        await this._currencyService.loadCurrencies((isAvailable, data) => {
            if (this._mounted) {
                this.setState(
                    {
                        currencies: isAvailable && data ? data.currencies : undefined,
                        fiatCode: isAvailable && data ? data.fiatCode : "EUR",
                        baseCurrencyRate: isAvailable && data ? data.baseCurrencyRate : 1
                    },
                    async () => {
                        if (this._mounted) {
                            this.setState({
                                valueConverted: await this._currencyService.currencyConvert(
                                    valueIota,
                                    {
                                        fiatCode: this.state.fiatCode || "EUR",
                                        currencies: this.state.currencies,
                                        baseCurrencyRate: this.state.baseCurrencyRate
                                    },
                                    false)
                            }
                            );
                        }
                    });
            }
        });
    }
}

export default InlineCurrency;
