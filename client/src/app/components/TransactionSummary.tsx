import { asTransactionObject } from "@iota/transaction-converter";
import moment from "moment";
import React, { Component, ReactNode } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { TangleCacheService } from "../../services/tangleCacheService";
import Confirmation from "./Confirmation";
import "./TransactionSummary.scss";
import { TransactionSummaryProps } from "./TransactionSummaryProps";
import { TransactionSummaryState } from "./TransactionSummaryState";

/**
 * Component which will display a transaction summary.
 */
class TransactionSummary extends Component<TransactionSummaryProps, TransactionSummaryState> {
    /**
     * The tangle cache service.
     */
    private readonly _tangleCacheService: TangleCacheService;

    /**
     * Is the component mounted.
     */
    private _mounted: boolean;

    /**
     * Timer for date counter;
     */
    private _dateTimer?: NodeJS.Timer;

    /**
     * Create a new instance of TransactionSummary.
     * @param props The props.
     */
    constructor(props: TransactionSummaryProps) {
        super(props);

        this._tangleCacheService = ServiceFactory.get<TangleCacheService>("tangle-cache");
        this._mounted = false;

        this.state = {
            confirmationState: "unknown"
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

        const trytes = await this._tangleCacheService.getTransactions([this.props.hash], this.props.network);

        if (this._mounted && trytes && trytes.length > 0) {
            const confirmationStates =
                await this._tangleCacheService.getTransactionConfirmationStates(
                    [this.props.hash], this.props.network);

            const transactionObject = asTransactionObject(trytes[0]);

            const timeMoment = moment(transactionObject.timestamp * 1000);

            const postDate = (transactionObject.timestamp * 1000) > Date.now() ? "in the future" : "ago";

            this.setState({
                transactionObject,
                confirmationState: confirmationStates[0],
                time: timeMoment,
                timeHuman: `${timeMoment.format("LLLL")} - ${moment.duration(moment().diff(timeMoment)).humanize()} ${postDate}`,
                valueIota: `${transactionObject.value} i`
            });

            this._dateTimer = setInterval(
                () => {
                    this.setState({
                        timeHuman: `${timeMoment.format("LLLL")} - ${moment.duration(moment().diff(timeMoment)).humanize()} ${postDate}`
                    });
                },
                1000);
        }
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;

        if (this._dateTimer) {
            clearInterval(this._dateTimer);
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const network = this.props.network === "mainnet" ? "" : `/${this.props.network}`;

        return (
            <div className="transaction-summary">
                <div className="transaction-summary--row">
                    <div className="col1 time">
                        {this.state.timeHuman}
                    </div>
                    <div className="col2">
                        {this.state.valueIota}
                    </div>
                </div>
                <div className="transaction-summary--row">
                    <Link
                        className="col1 nav-link"
                        to={`/transaction/${this.props.hash}${network}`}
                    >
                        {this.props.hash}
                    </Link>
                    <div className="col2">
                        <Confirmation state={this.state.confirmationState} />
                    </div>
                </div>
                {this.state.transactionObject && (
                    <div className="transaction-summary--row">
                        <FaChevronLeft />
                        <Link
                            className="col1 nav-link nav-link--small"
                            to={`/bundle/${this.state.transactionObject?.bundle}${network}`}
                        >
                            {this.state.transactionObject?.bundle}
                        </Link>
                        <div className="col2">
                            &nbsp;
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default TransactionSummary;
