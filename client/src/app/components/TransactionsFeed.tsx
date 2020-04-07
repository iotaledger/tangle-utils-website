import { convertUnits, Unit } from "@iota/unit-converter";
import { Fieldset, Form, Heading, Input, Select } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { UnitsHelper } from "../../helpers/unitsHelper";
import { ValueFilter } from "../../models/services/valueFilter";
import { SettingsService } from "../../services/settingsService";
import { TransactionsClient } from "../../services/transactionsClient";
import "./TransactionsFeed.scss";
import { TransactionsFeedState } from "./TransactionsFeedState";

/**
 * Component which will display transactions feeds.
 */
class TransactionsFeed extends Component<any, TransactionsFeedState> {
    /**
     * Transactions Client for live streams.
     */
    private readonly _transactionsClient: TransactionsClient;

    /**
     * The settings service.
     */
    private readonly _settingsService: SettingsService;

    /**
     * Subscription id.
     */
    private _subscriptionId?: string;

    /**
     * Timer id.
     */
    private _timerId?: NodeJS.Timer;

    /**
     * Is the component mounted.
     */
    private _mounted: boolean;

    /**
     * Create a new instance of TransactionsFeed.
     * @param props The props.
     */
    constructor(props: any) {
        super(props);

        this._transactionsClient = ServiceFactory.get<TransactionsClient>("transactions");
        this._settingsService = ServiceFactory.get<SettingsService>("settings");
        this._mounted = false;

        this.state = {
            mainnetTransactions: [],
            devnetTransactions: [],
            valueMinimum: "0",
            valueMinimumUnits: Unit.i,
            valueMaximum: "1",
            valueMaximumUnits: Unit.Ti,
            valueFilter: "both",
            mainnetTps: "",
            devnetTps: ""
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

        const response = await this._transactionsClient.subscribe(async () => {
            await this.updateFeeds(false);
        });

        if (response && response.success) {
            this._subscriptionId = response.subscriptionId;
        }

        await this.updateFeeds(false);

        this._timerId = setInterval(() => this.updateTps(), 2000);
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;

        if (this._subscriptionId) {
            await this._transactionsClient.unsubscribe({ subscriptionId: this._subscriptionId });
        }

        if (this._timerId) {
            clearInterval(this._timerId);
            this._timerId = undefined;
        }
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
                                { valueFilter: e.target.value as ValueFilter }, () => this.updateFeeds(true))}
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
                                { valueMinimumUnits: e.target.value as Unit }, () => this.updateFeeds(true))}
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
                                { valueMaximumUnits: e.target.value as Unit }, () => this.updateFeeds(true))}
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
                    <div className="feed">
                        <Heading level={2}>MainNet {this.state.mainnetTps}</Heading>
                        {this.state.mainnetTransactions.length === 0 &&
                            ("There are no transactions with the current filters.")}
                        {this.state.mainnetTransactions.map((tx, idx) => (
                            <div className="row" key={idx}>
                                <Link className="small" to={`/transaction/${tx.hash}`}>{tx.hash}</Link>
                                <div className="value">{UnitsHelper.formatBest(tx.value, false)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="feed">
                        <Heading level={2}>DevNet {this.state.devnetTps}</Heading>
                        {this.state.devnetTransactions.length === 0 &&
                            ("There are no transactions with the current filters.")}
                        {this.state.devnetTransactions.map((tx, idx) => (
                            <div className="row" key={idx}>
                                <Link className="small" to={`/transaction/${tx.hash}/devnet`}>{tx.hash}</Link>
                                <div className="value">{UnitsHelper.formatBest(tx.value, false)}</div>
                            </div>
                        ))}
                    </div>
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
            this.setState({ valueMinimum: val.toString() }, () => this.updateFeeds(true));
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
            this.setState({ valueMaximum: val.toString() }, () => this.updateFeeds(true));
        } else {
            this.setState({ valueMaximum: "" });
        }
    }

    /**
     * Update the transaction feeds.
     * @param save Save the settings.
     */
    private async updateFeeds(save: boolean): Promise<void> {
        if (this._mounted) {
            const minLimit = convertUnits(this.state.valueMinimum, this.state.valueMinimumUnits, Unit.i);
            const maxLimit = convertUnits(this.state.valueMaximum, this.state.valueMaximumUnits, Unit.i);

            this.setState({
                mainnetTransactions: this._transactionsClient.getMainNetTransactions()
                    .filter(t => this.state.mainnetTransactions.findIndex(t2 => t2.hash === t.hash) < 0)
                    .concat(this.state.mainnetTransactions)
                    .filter(t => Math.abs(t.value) >= minLimit && Math.abs(t.value) <= maxLimit)
                    .filter(t => this.state.valueFilter === "both" ? true :
                        this.state.valueFilter === "zeroOnly" ? t.value === 0 :
                            t.value !== 0)
                    .slice(0, 10),
                devnetTransactions: this._transactionsClient.getDevNetTransactions()
                    .filter(t => this.state.devnetTransactions.findIndex(t2 => t2.hash === t.hash) < 0)
                    .concat(this.state.devnetTransactions)
                    .filter(t => Math.abs(t.value) >= minLimit && Math.abs(t.value) <= maxLimit)
                    .filter(t => this.state.valueFilter === "both" ? true :
                        this.state.valueFilter === "zeroOnly" ? t.value === 0 :
                            t.value !== 0)
                    .slice(0, 10)
            });

            if (save) {
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

    /**
     * Update the transactions per second.
     */
    private updateTps(): void {
        const mainnetTps = this._transactionsClient.getMainNetTps();
        const devnetTps = this._transactionsClient.getDevNetTps();

        this.setState({
            mainnetTps: mainnetTps >= 0 ? `[${mainnetTps.toFixed(2)} TPS]` : "",
            devnetTps: devnetTps >= 0 ? `[${devnetTps.toFixed(2)} TPS]` : ""
        });
    }
}

export default TransactionsFeed;
