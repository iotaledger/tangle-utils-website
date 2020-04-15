import { convertUnits, Unit } from "@iota/unit-converter";
import { Heading } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { UnitsHelper } from "../../helpers/unitsHelper";
import { TransactionsClient } from "../../services/transactionsClient";
import "./TransactionsFeed.scss";
import { TransactionsFeedListProps } from "./TransactionsFeedListProps";
import { TransactionsFeedListState } from "./TransactionsFeedListState";

/**
 * Component which will display transactions feeds.
 */
class TransactionsFeedList extends Component<TransactionsFeedListProps, TransactionsFeedListState> {
    /**
     * Transactions Client for live streams.
     */
    private readonly _transactionsClient: TransactionsClient;

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
     * Create a new instance of TransactionsFeedList.
     * @param props The props.
     */
    constructor(props: TransactionsFeedListProps) {
        super(props);

        this._transactionsClient =
            ServiceFactory.get<TransactionsClient>(`transactions-${props.network}`);

        this._mounted = false;

        this.state = {
            transactions: [],
            tps: ""
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

        this._subscriptionId =
            await this._transactionsClient.subscribe(async () => {
                await this.updateFeed();
            });

        await this.updateFeed();

        this._timerId = setInterval(() => this.updateTps(), 2000);
    }

    /**
     * The component performed an update.
     * @param prevProps The previous properties.
     */
    public async componentDidUpdate(prevProps: TransactionsFeedListProps): Promise<void> {
        if (prevProps.valueFilter !== this.props.valueFilter ||
            prevProps.valueMinimum !== this.props.valueMinimum ||
            prevProps.valueMinimumUnits !== this.props.valueMinimumUnits ||
            prevProps.valueMaximum !== this.props.valueMaximum ||
            prevProps.valueMaximumUnits !== this.props.valueMaximumUnits) {
            await this.updateFeed();
        }
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;

        if (this._subscriptionId) {
            await this._transactionsClient
                .unsubscribe(this._subscriptionId);
            this._subscriptionId = undefined;
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
            <div className="feed">
                <Heading level={2}>{this.props.label} {this.state.tps}</Heading>
                {this.state.transactions.length === 0 &&
                    ("There are no transactions with the current filters.")}
                {this.state.transactions.map((tx, idx) => (
                    <div className="row" key={idx}>
                        <Link
                            className="small"
                            to={`/transaction/${tx.hash}${this.props.navPath}`}
                        >
                            {tx.hash}
                        </Link>
                        <div className="value">{UnitsHelper.formatBest(tx.value, false)}</div>
                    </div>
                ))}
            </div>
        );
    }

    /**
     * Update the transaction feeds.
     */
    private async updateFeed(): Promise<void> {
        if (this._mounted) {
            const minLimit = convertUnits(this.props.valueMinimum, this.props.valueMinimumUnits, Unit.i);
            const maxLimit = convertUnits(this.props.valueMaximum, this.props.valueMaximumUnits, Unit.i);

            const transactions = this._transactionsClient.getTransactions()
                .filter(t => this.state.transactions
                    .findIndex(t2 => t2.hash === t.hash) < 0)
                .concat(this.state.transactions)
                .filter(t => Math.abs(t.value) >= minLimit && Math.abs(t.value) <= maxLimit)
                .filter(t => this.props.valueFilter === "both" ? true :
                    this.props.valueFilter === "zeroOnly" ? t.value === 0 :
                        t.value !== 0)
                .slice(0, 10);

            this.setState({
                transactions
            });
        }
    }

    /**
     * Update the transactions per second.
     */
    private updateTps(): void {
        const t = this._transactionsClient.getTps();
        const tps = t >= 0 ? `[${t.toFixed(2)} TPS]` : "";

        this.setState({
            tps
        });
    }
}

export default TransactionsFeedList;
