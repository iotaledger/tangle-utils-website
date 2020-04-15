import { Unit } from "@iota/unit-converter";
import { Fieldset, Form, Input, Select } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IConfiguration } from "../../models/config/IConfiguration";
import { INetworkConfiguration } from "../../models/config/INetworkConfiguration";
import { ValueFilter } from "../../models/services/valueFilter";
import { ConfigurationService } from "../../services/configurationService";
import { SettingsService } from "../../services/settingsService";
import "./TransactionsFeed.scss";
import TransactionsFeedList from "./TransactionsFeedList";
import { TransactionsFeedState } from "./TransactionsFeedState";

/**
 * Component which will display transactions feeds.
 */
class TransactionsFeed extends Component<any, TransactionsFeedState> {
    /**
     * The settings service.
     */
    private readonly _settingsService: SettingsService;

    /**
     * Is the component mounted.
     */
    private _mounted: boolean;

    /**
     * Networks.
     */
    private readonly _networks: INetworkConfiguration[];

    /**
     * Create a new instance of TransactionsFeed.
     * @param props The props.
     */
    constructor(props: any) {
        super(props);

        this._settingsService = ServiceFactory.get<SettingsService>("settings");

        const configService = ServiceFactory.get<ConfigurationService<IConfiguration>>("configuration");
        this._networks = configService.get().networks;

        this._mounted = false;

        this.state = {
            valueMinimum: "0",
            valueMinimumUnits: Unit.i,
            valueMaximum: "1",
            valueMaximumUnits: Unit.Ti,
            valueFilter: "both"
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

        const settings = await this._settingsService.get();
        if (settings) {
            if (this._mounted) {
                this.setState({
                    valueMinimum: settings.valueMinimum || "0",
                    valueMinimumUnits: settings.valueMinimumUnits || Unit.i,
                    valueMaximum: settings.valueMaximum || "1",
                    valueMaximumUnits: settings.valueMaximumUnits || Unit.Ti,
                    valueFilter: settings.valueFilter || "both"
                });
            }
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
        return (
            <div className="transactions-feed">
                <Form>
                    <Fieldset>
                        <label>Value Filter</label>
                        <Select
                            value={this.state.valueFilter}
                            onChange={e => this.setState(
                                { valueFilter: e.target.value as ValueFilter }, () => this.updateFilters())}
                            selectSize="small"
                        >
                            <option value="both">Both</option>
                            <option value="zeroOnly">Zero Only</option>
                            <option value="nonZeroOnly">Non Zero Only</option>
                        </Select>
                    </Fieldset>
                    <Fieldset>
                        <label>Limit</label>
                        <Input
                            type="text"
                            value={this.state.valueMinimum}
                            placeholder="Enter limit for the values"
                            restrict="float"
                            inputSize="small"
                            onChange={e => this.updateMinimum(e.target.value)}
                        />
                        <Select
                            value={this.state.valueMinimumUnits}
                            onChange={e => this.setState(
                                { valueMinimumUnits: e.target.value as Unit }, () => this.updateFilters())}
                            selectSize="small"
                        >
                            <option value="i">i</option>
                            <option value="Ki">Ki</option>
                            <option value="Mi">Mi</option>
                            <option value="Gi">Gi</option>
                            <option value="Ti">Ti</option>
                            <option value="Pi">Pi</option>
                        </Select>
                        <span className="limit-label">To</span>
                        <Input
                            type="text"
                            value={this.state.valueMaximum}
                            placeholder="Enter limit for the values"
                            restrict="float"
                            inputSize="small"
                            onChange={e => this.updateMaximum(e.target.value)}
                        />
                        <Select
                            value={this.state.valueMaximumUnits}
                            onChange={e => this.setState(
                                { valueMaximumUnits: e.target.value as Unit }, () => this.updateFilters())}
                            selectSize="small"
                        >
                            <option value="i">i</option>
                            <option value="Ki">Ki</option>
                            <option value="Mi">Mi</option>
                            <option value="Gi">Gi</option>
                            <option value="Ti">Ti</option>
                            <option value="Pi">Pi</option>
                        </Select>
                    </Fieldset>
                </Form>
                <div className="feed-wrapper">
                    {this._networks.map((netConfig, idxNetwork) => (
                        <TransactionsFeedList
                            key={netConfig.network}
                            network={netConfig.network}
                            label={netConfig.label}
                            navPath={idxNetwork === 0 ? "" : `/${netConfig.network}`}
                            valueMinimum={this.state.valueMinimum}
                            valueMinimumUnits={this.state.valueMinimumUnits}
                            valueMaximum={this.state.valueMaximum}
                            valueMaximumUnits={this.state.valueMaximumUnits}
                            valueFilter={this.state.valueFilter}
                        />
                    ))}
                </div>
            </div>
        );
    }

    /**
     * Update the minimum filter.
     * @param min The min value from the form.
     */
    private updateMinimum(min: string): void {
        const val = parseFloat(min);

        if (!Number.isNaN(val)) {
            this.setState({ valueMinimum: val.toString() }, () => this.updateFilters());
        } else {
            this.setState({ valueMinimum: "" });
        }
    }

    /**
     * Update the maximum filter.
     * @param max The max value from the form.
     */
    private updateMaximum(max: string): void {
        const val = parseFloat(max);

        if (!Number.isNaN(val)) {
            this.setState({ valueMaximum: val.toString() }, () => this.updateFilters());
        } else {
            this.setState({ valueMaximum: "" });
        }
    }

    /**
     * Update the transaction feeds.
     */
    private async updateFilters(): Promise<void> {
        if (this._mounted) {
            const settings = await this._settingsService.get();

            if (settings) {
                settings.valueFilter = this.state.valueFilter;
                settings.valueMinimum = this.state.valueMinimum;
                settings.valueMinimumUnits = this.state.valueMinimumUnits;
                settings.valueMaximum = this.state.valueMaximum;
                settings.valueMaximumUnits = this.state.valueMaximumUnits;

                await this._settingsService.save();
            }
        }
    }
}

export default TransactionsFeed;
