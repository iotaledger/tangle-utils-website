import * as IotaAreaCodes from "@iota/area-codes";
import isBundle from "@iota/bundle-validator";
import { addChecksum } from "@iota/checksum";
import { trytesToTrits } from "@iota/converter";
import { asTransactionObject, Transaction } from "@iota/transaction-converter";
import { isEmpty } from "@iota/validators";
import { Button, ClipboardHelper, Heading, Select, Spinner } from "iota-react-components";
import moment from "moment";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { TrytesHelper } from "../../helpers/trytesHelper";
import { UnitsHelper } from "../../helpers/unitsHelper";
import { CurrencyService } from "../../services/currencyService";
import { TangleCacheService } from "../../services/tangleCacheService";
import Confirmation from "./Confirmation";
import "./TransactionObject.scss";
import { TransactionObjectProps } from "./TransactionObjectProps";
import { TransactionObjectState } from "./TransactionObjectState";

/**
 * Component which will display a transaction.
 */
class TransactionObject extends Component<TransactionObjectProps, TransactionObjectState> {
    /**
     * The tangle cache service.
     */
    private readonly _tangleCacheService: TangleCacheService;

    /**
     * The network to use for transaction requests.
     */
    private readonly _currencyService: CurrencyService;

    /**
     * Confirmation state timer.
     */
    private _confirmationTimerId?: NodeJS.Timer;

    /**
     * Is the component mounted.
     */
    private _mounted: boolean;

    /**
     * Create a new instance of TransactionObject.
     * @param props The props.
     */
    constructor(props: TransactionObjectProps) {
        super(props);

        this._tangleCacheService = ServiceFactory.get<TangleCacheService>("tangle-cache");
        this._currencyService = ServiceFactory.get<CurrencyService>("currency");
        this._mounted = false;

        const transactionObject = asTransactionObject(this.props.trytes);

        const decoded = TrytesHelper.decodeMessage(transactionObject.signatureMessageFragment);

        const trits = trytesToTrits(transactionObject.hash);

        let mwm = 0;
        for (let i = trits.length - 1; i >= 0; i--) {
            if (trits[i] !== 0) {
                break;
            }
            mwm++;
        }

        const iac = transactionObject.tag.replace(/\9+$/, "");

        const timeMoment = moment(transactionObject.timestamp * 1000);
        const attachmentTimeMoment = moment(transactionObject.attachmentTimestamp);

        const postDate = (transactionObject.timestamp * 1000) > Date.now() ? "in the future" : "ago";
        const postAttachmentDate = transactionObject.attachmentTimestamp > Date.now() ? "in the future" : "ago";

        this.state = {
            transactionObject,
            confirmationState: "unknown",
            time: timeMoment,
            timeHuman: `${timeMoment.format("LLLL")} - ${moment.duration(moment().diff(timeMoment)).humanize()} ${postDate}`,
            valueFormatted: UnitsHelper.formatBest(transactionObject.value, false),
            valueIota: `${transactionObject.value} i`,
            currencies: [],
            isMissing: this.props.hideInteractive ? false : isEmpty(this.props.trytes),
            mwm,
            message: decoded.message,
            messageType: decoded.messageType,
            messageShowRaw: false,
            messageSpans: false,
            attachmentTime: moment(transactionObject.attachmentTimestamp),
            attachmentTimeHuman: `${attachmentTimeMoment.format("LLLL")} - ${
                moment.duration(moment().diff(attachmentTimeMoment)).humanize()} ${postAttachmentDate}`,
            addressChecksum: addChecksum(transactionObject.address).substr(-9),
            bundleResult: "",
            iac: IotaAreaCodes.isValid(iac) ? iac : ""
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

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
                                    this.state.transactionObject.value,
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

        if (!this.props.hideInteractive && this._mounted) {
            const thisGroup: ReadonlyArray<Transaction> =
                await this._tangleCacheService.getTransactionBundleGroup(
                    this.state.transactionObject, this.props.network);

            if (thisGroup && thisGroup.length > 0) {
                const thisIndex = thisGroup.findIndex(t => t.hash === this.state.transactionObject.hash);

                const pos = thisGroup.filter(t => t.value > 0).length;
                const neg = thisGroup.filter(t => t.value < 0).length;
                const zero = thisGroup.filter(t => t.value === 0).length;

                let bundleResult = "";

                if (pos === 1 && neg === 1 && zero === 0) {
                    bundleResult = "Does not transfer any IOTA.";
                } else if (zero === thisGroup.length) {
                    bundleResult = "Contains data, but does not transfer IOTA.";
                } else {
                    bundleResult = `Transfers IOTA from ${pos} input address${
                        pos > 1 ? "s" : ""} to ${neg} output address${neg > 1 ? "s" : ""}.`;
                }

                // See if we can create a longer message using all of the transactions in this group
                let message = this.state.message;
                let messageType = this.state.messageType;
                let messageSpans = this.state.messageSpans;

                const wholeMessage = thisGroup.map(t => t.signatureMessageFragment).join("");

                const wholeDecoded = TrytesHelper.decodeMessage(wholeMessage);

                if ((wholeDecoded.messageType === "ASCII" ||
                    wholeDecoded.messageType === "JSON") &&
                    wholeDecoded.message !== this.state.message) {
                    message = wholeDecoded.message;
                    messageType = wholeDecoded.messageType;
                    messageSpans = true;
                }

                const isValid = isBundle(thisGroup);
                const tailHash = thisGroup[0].hash;

                if (this._mounted) {
                    this.setState(
                        {
                            isBundleValid: isValid ? true : false,
                            bundleResult,
                            message,
                            messageType,
                            messageSpans,
                            tailHash,
                            nextTransactionHash:
                                this.state.transactionObject.currentIndex < this.state.transactionObject.lastIndex ?
                                    this.state.transactionObject.trunkTransaction : undefined,
                            prevTransactionHash: thisIndex > 0 ? thisGroup[thisIndex - 1].hash : undefined
                        },
                        () => this.checkConfirmation());
                }
            }
        }
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;

        if (this._confirmationTimerId) {
            clearTimeout(this._confirmationTimerId);
            this._confirmationTimerId = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const network = this.props.network === "mainnet" ? "" : `/${this.props.network}`;

        const state = this.state;

        return (
            <div className="transaction-object">
                <div className="row">
                    <div className="value">{this.props.hash}</div>
                    <div className="action-container">
                        <Button
                            color="secondary"
                            size="small"
                            onClick={() => ClipboardHelper.copy(this.props.hash)}
                        >
                            Copy
                        </Button>
                        <Link
                            className="button button--secondary button--small"
                            to={
                                `/qr-create/${state.transactionObject.address}${state.addressChecksum}/${
                                state.transactionObject.value}/${state.messageType === "ASCII" ? state.message
                                    : ""}`
                            }
                        >
                            QR
                        </Link>
                    </div>
                </div>
                {this.state.isMissing && (
                    <React.Fragment>
                        <hr />
                        <div className="row">
                            <div className="value">
                                The data for this transaction is not available.
                                <br />
                                <br />
                                This could be because it has not yet synced to the node or it was removed by a snapshot.
                            </div>
                        </div>
                    </React.Fragment>
                )}
                {!this.state.isMissing && (
                    <React.Fragment>
                        <div className="row">
                            <div className="value">
                                {this.state.timeHuman}
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Value</div>
                                <div className="value">
                                    <span className="currency">{this.state.valueFormatted}</span>
                                    {this.state.valueFormatted !== this.state.valueIota && (
                                        <span className="currency">{this.state.valueIota}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {this.state.currencies && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">Currency</div>
                                    <div className="value">
                                        {this.state.currencies.length > 0 && (
                                            <Select
                                                value={this.state.fiatCode}
                                                onChange={e => this.setState({ fiatCode: e.target.value }, async () => {
                                                    if (this._mounted) {
                                                        this.setState(
                                                            {
                                                                valueConverted:
                                                                    await this._currencyService.currencyConvert(
                                                                        this.state.transactionObject.value,
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
                                        )}
                                        <span className="currency">{this.state.valueConverted}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="row">
                            <div className="col">
                                <div className="label">Address</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/address/${this.state.transactionObject.address}${network}`}
                                    >
                                        {this.state.transactionObject.address}
                                        <span className="checksum">{this.state.addressChecksum}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        {!this.props.hideInteractive && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">Status</div>
                                    <div className="value">
                                        <Confirmation state={this.state.confirmationState} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <hr />
                        <Heading level={2}>Bundle</Heading>
                        {!this.props.hideInteractive && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">Is Valid</div>
                                    {this.state.isBundleValid === undefined && (
                                        <Spinner size="small" />
                                    )}

                                    {this.state.isBundleValid !== undefined && (
                                        <div
                                            className={`value ${this.state.isBundleValid ? "yes" : "no"}`}
                                        >
                                            {this.state.isBundleValid ? "Yes" : "No - This bundle will never confirm"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="row">
                            <div className="col">
                                <div className="label">Bundle Hash</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/bundle/${this.state.transactionObject.bundle}${network}`}
                                    >
                                        {this.state.transactionObject.bundle}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Index</div>
                                <div className="value">
                                    {this.state.prevTransactionHash && (
                                        <React.Fragment>
                                            <Link
                                                className="button button--secondary button--small"
                                                to={`/transaction/${this.state.prevTransactionHash}${network}`}
                                            >
                                                Prev
                                            </Link>
                                            &nbsp;
                                        </React.Fragment>
                                    )}
                                    <div className="index">
                                        {this.state.transactionObject.currentIndex} / {
                                            this.state.transactionObject.lastIndex}
                                    </div>
                                    {this.state.nextTransactionHash && (
                                        <React.Fragment>
                                            &nbsp;
                                            <Link
                                                className="button button--secondary button--small"
                                                to={`/transaction/${this.state.nextTransactionHash}${network}`}
                                            >
                                                Next
                                            </Link>
                                        </React.Fragment>
                                    )}
                                </div>
                            </div>
                        </div>
                        <hr />
                        <Heading level={2}>Content</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Tag</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/tag/${this.state.transactionObject.tag}${network}`}
                                    >
                                        {this.state.transactionObject.tag}
                                    </Link>
                                </div>
                            </div>
                            <div className="col">
                                <div className="label">Obsolete Tag</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/tag/${this.state.transactionObject.obsoleteTag}${network}`}
                                    >
                                        {this.state.transactionObject.obsoleteTag}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        {this.state.iac && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">Area Code</div>
                                    <div className="value">
                                        <Link
                                            className="button button--secondary button--small"
                                            to={`/area-codes/${this.state.iac}`}
                                        >
                                            View Map
                                        </Link>
                                        The Tag contains an IOTA Area Code which can be viewed.
                                    </div>
                                </div>
                            </div>
                        )}
                        {!this.state.messageShowRaw && (
                            <div className="row top">
                                <div className="col top fill">
                                    <div className="label">Message<br />{this.state.messageType}</div>
                                    <div className="value fill">
                                        <pre className={this.state.messageType.toLowerCase()}>{this.state.message}</pre>
                                    </div>
                                </div>
                            </div>
                        )}
                        {this.state.messageShowRaw && (
                            <div className="row top">
                                <div className="col top fill">
                                    <div className="label">Message<br />Trytes</div>
                                    <div className="value fill">
                                        <pre className="trytes">
                                            {this.state.transactionObject.signatureMessageFragment}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}
                        {this.state.messageSpans && !this.state.messageShowRaw && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">&nbsp;</div>
                                    <div className="value fill strong info">
                                        This message spans multiple transactions in the bundle.
                                    </div>
                                </div>
                            </div>
                        )}
                        {this.state.messageType !== "Trytes" && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">&nbsp;</div>
                                    <div className="value">
                                        <Button
                                            color="secondary"
                                            size="small"
                                            onClick={() => this.setState(
                                                { messageShowRaw: !this.state.messageShowRaw })}
                                        >
                                            {this.state.messageShowRaw ?
                                                `Show ${this.state.messageType}` : "Show Trytes"}
                                        </Button>
                                        <Button
                                            color="secondary"
                                            size="small"
                                            onClick={() => ClipboardHelper.copy(
                                                this.state.messageShowRaw ?
                                                    this.state.transactionObject.signatureMessageFragment :
                                                    this.state.message)}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <hr />
                        <Heading level={2}>Parents</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Trunk</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/transaction/${this.state.transactionObject.trunkTransaction}${network}`}
                                    >
                                        {this.state.transactionObject.trunkTransaction}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Branch</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/transaction/${this.state.transactionObject.branchTransaction}${network}`}
                                    >
                                        {this.state.transactionObject.branchTransaction}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <hr />
                        <Heading level={2}>PoW</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Timestamp</div>
                                <div className="value">
                                    {this.state.attachmentTimeHuman}
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Weight</div>
                                <div className="value">{this.state.mwm}</div>
                            </div>
                            <div className="col">
                                <div className="label">Nonce</div>
                                <div className="value">{this.state.transactionObject.nonce}</div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Lower Bound</div>
                                <div className="value">
                                    {this.state.transactionObject.attachmentTimestampLowerBound}
                                </div>
                            </div>
                            <div className="col">
                                <div className="label">Upper Bound</div>
                                <div className="value">
                                    {this.state.transactionObject.attachmentTimestampUpperBound}
                                </div>
                            </div>
                        </div>
                        {!this.props.hideInteractive && (
                            <React.Fragment>
                                <hr />
                                <Heading level={2}>Raw</Heading>
                                <div className="row">
                                    <div className="col top">
                                        <div className="label">Trytes</div>
                                        <div className="value"><pre className="trytes">{this.props.trytes}</pre></div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col">
                                        <div className="label">&nbsp;</div>
                                        <div className="value">
                                            <Button
                                                color="secondary"
                                                size="small"
                                                onClick={() => ClipboardHelper.copy(this.props.trytes)}
                                            >
                                                Copy
                                            </Button>
                                            <Link
                                                className="button button--secondary button--small"
                                                to={`/compress/${this.props.trytes}`}
                                            >
                                                View Compression Statistics
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        )}
                    </React.Fragment>
                )}
            </div>
        );
    }

    /**
     * Check the confirmation state.
     */
    private async checkConfirmation(): Promise<void> {
        if (this._confirmationTimerId) {
            clearTimeout(this._confirmationTimerId);
            this._confirmationTimerId = undefined;
        }

        const confirmationStates =
            await this._tangleCacheService.getTransactionConfirmationStates(
                [this.props.hash], this.props.network);
        let isPromotable = false;

        if (confirmationStates[0] !== "confirmed" && this.state.tailHash) {
            isPromotable =
                await this._tangleCacheService.isTransactionPromotable(
                    this.state.tailHash, this.props.network);
        }

        if (this._mounted) {
            this.setState({
                confirmationState: confirmationStates[0],
                isPromotable
            });
        }

        if (confirmationStates[0] !== "confirmed") {
            this._confirmationTimerId = setTimeout(() => this.checkConfirmation(), 15000);
        }
    }

    /**
     * Promote the transaction
     */
    private async promote(): Promise<void> {
        if (this.state.isPromotable && this.state.tailHash && this._mounted) {
            this.setState({ isPromoting: true }, async () => {
                if (this.state.tailHash) {
                    await this._tangleCacheService.transactionPromote(this.state.tailHash, this.props.network);
                }
                if (this._mounted) {
                    this.setState({ isPromoting: false });
                }
            });
        }
    }
}

export default TransactionObject;
