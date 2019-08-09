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
            valueLimit: 1,
            valueLimitUnits: Unit.Ti,
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
                    valueLimit: settings.valueLimit || 1,
                    valueLimitUnits: settings.valueLimitUnits || Unit.Ti,
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
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;

        if (this._subscriptionId) {
            await this._transactionsClient.unsubscribe({ subscriptionId: this._subscriptionId });
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
                        <label>Value Limit</label>
                        <Input
                            type="text"
                            value={this.state.valueLimit}
                            placeholder="Enter limit for the values"
                            restrict="float"
                            inputSize="small"
                            onChange={e => this.setState(
                                { valueLimit: parseFloat(e.target.value) }, () => this.updateFeeds(true))}
                        />
                        <Select
                            value={this.state.valueLimitUnits}
                            onChange={e => this.setState(
                                { valueLimitUnits: e.target.value as Unit }, () => this.updateFeeds(true))}
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
                        <Heading level={2}>MainNet</Heading>
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
                        <Heading level={2}>DevNet</Heading>
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
     * Update the transaction feeds.
     * @param save Save the settings.
     */
    private async updateFeeds(save: boolean): Promise<void> {
        if (this._mounted) {
            const limit = convertUnits(this.state.valueLimit, this.state.valueLimitUnits, Unit.i);

            this.setState({
                mainnetTransactions: this._transactionsClient.getMainNetTransactions()
                    .filter(t => this.state.mainnetTransactions.findIndex(t2 => t2.hash === t.hash) < 0)
                    .concat(this.state.mainnetTransactions)
                    .filter(t => t.value >= -limit && t.value <= limit)
                    .filter(t => this.state.valueFilter === "both" ? true :
                        this.state.valueFilter === "zeroOnly" ? t.value === 0 :
                            t.value !== 0)
                    .slice(0, 10),
                devnetTransactions: this._transactionsClient.getDevNetTransactions()
                    .filter(t => this.state.devnetTransactions.findIndex(t2 => t2.hash === t.hash) < 0)
                    .concat(this.state.devnetTransactions)
                    .filter(t => t.value >= -limit && t.value <= limit)
                    .filter(t => this.state.valueFilter === "both" ? true :
                        this.state.valueFilter === "zeroOnly" ? t.value === 0 :
                            t.value !== 0)
                    .slice(0, 10)
            });

            if (save) {
                const settings = await this._settingsService.get();
                if (settings) {
                    settings.valueFilter = this.state.valueFilter;
                    settings.valueLimit = this.state.valueLimit;
                    settings.valueLimitUnits = this.state.valueLimitUnits;

                    await this._settingsService.save();
                }
            }
        }
    }
}

export default TransactionsFeed;
