import * as IotaAreaCodes from "@iota/area-codes";
import isBundle from "@iota/bundle-validator";
import { addChecksum } from "@iota/checksum";
import { trytesToTrits, value } from "@iota/converter";
import { Transaction } from "@iota/core";
import { asTransactionObject, asTransactionTrytes } from "@iota/transaction-converter";
import { isEmpty } from "@iota/validators";
import { Button, ClipboardHelper, Heading } from "iota-react-components";
import moment from "moment";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { TrytesHelper } from "../../helpers/trytesHelper";
import { UnitsHelper } from "../../helpers/unitsHelper";
import { IConfiguration } from "../../models/config/IConfiguration";
import { INetworkConfiguration } from "../../models/config/INetworkConfiguration";
import { ConfirmationState } from "../../models/confirmationState";
import { ConfigurationService } from "../../services/configurationService";
import { TangleCacheService } from "../../services/tangleCacheService";
import Confirmation from "./Confirmation";
import InlineCurrency from "./InlineCurrency";
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
     * Networks.
     */
    private readonly _networks: INetworkConfiguration[];

    /**
     * Confirmation state timer.
     */
    private _confirmationTimerId?: NodeJS.Timer;

    /**
     * Timer for date counter;
     */
    private _dateTimer?: NodeJS.Timer;

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
        const configService = ServiceFactory.get<ConfigurationService<IConfiguration>>("configuration");
        this._networks = configService.get().networks;

        this._mounted = false;

        let tx: Transaction | undefined;
        let trytes: string | undefined;
        let confirmationState: ConfirmationState | undefined;

        if (this.props.cached) {
            tx = this.props.cached.tx;
            trytes = asTransactionTrytes(tx);
            confirmationState = this.props.cached.confirmationState;
        }

        if (this.props.trytes) {
            trytes = this.props.trytes;
            tx = asTransactionObject(this.props.trytes);
            confirmationState = "unknown";
        }

        if (tx && trytes && confirmationState) {
            const decoded = TrytesHelper.decodeMessage(tx.signatureMessageFragment);

            const trits = trytesToTrits(tx.hash);

            let mwm = 0;
            for (let i = trits.length - 1; i >= 0; i--) {
                if (trits[i] !== 0) {
                    break;
                }
                mwm++;
            }

            const iac = tx.tag.replace(/\9+$/, "");

            const timeMoment = moment(tx.timestamp * 1000);
            const attachmentTimeMoment = moment(tx.attachmentTimestamp);

            const postDate = (tx.timestamp * 1000) > Date.now() ? "in the future" : "ago";
            const postAttachmentDate = tx.attachmentTimestamp > Date.now() ? "in the future" : "ago";

            this.state = {
                trytes,
                tx,
                confirmationState,
                time: timeMoment,
                timeHuman: `${timeMoment.format("LLLL")} - ${moment.duration(moment().diff(timeMoment)).humanize()} ${postDate}`,
                valueFormatted: UnitsHelper.formatBest(tx.value, false),
                valueIota: `${tx.value} i`,
                isMissing: this.props.hideInteractive ? false : isEmpty(trytes),
                mwm,
                message: decoded.message,
                messageType: decoded.messageType,
                messageShowRaw: false,
                messageSpans: false,
                attachmentTime: moment(tx.attachmentTimestamp),
                attachmentTimeHuman: `${attachmentTimeMoment.format("LLLL")} - ${
                    moment.duration(moment().diff(attachmentTimeMoment)).humanize()} ${postAttachmentDate}`,
                addressChecksum: addChecksum(tx.address).substr(-9),
                isBundleValid: confirmationState === "confirmed" ? true : undefined,
                bundleResult: "",
                iac: IotaAreaCodes.isValid(iac) ? iac : "",
                milestoneIndex: -1
            };

            this._dateTimer = setInterval(
                () => {
                    this.setState({
                        timeHuman: `${timeMoment.format("LLLL")} - ${moment.duration(moment().diff(timeMoment)).humanize()} ${postDate}`,
                        attachmentTimeHuman: `${attachmentTimeMoment.format("LLLL")} - ${
                            moment.duration(moment().diff(attachmentTimeMoment)).humanize()} ${postAttachmentDate}`
                    });
                },
                1000);
        }
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

        if (!this.props.hideInteractive && this._mounted) {
            const thisGroup =
                await this._tangleCacheService.getTransactionBundleGroup(
                    {
                        tx: this.state.tx,
                        confirmationState: this.state.confirmationState,
                        cached: 0,
                        manual: false
                    },
                    this.props.network);

            if (thisGroup && thisGroup.length > 0) {
                const thisIndex = thisGroup.findIndex(t => t.tx.hash === this.state.tx.hash);

                let milestoneIndex = -1;

                if (thisGroup.length >= 2) {
                    const networkConfigs = ServiceFactory.get<INetworkConfiguration[]>("network-config");
                    const networkConfig = networkConfigs.find(n => n.network === this.props.network);

                    if (networkConfig) {
                        if (thisGroup[0].tx.address === networkConfig.coordinatorAddress &&
                            /^[9]+$/.test(thisGroup[thisGroup.length - 1].tx.address)) {
                            const mi = value(trytesToTrits(thisGroup[0].tx.tag));
                            if (!Number.isNaN(mi)) {
                                milestoneIndex = mi;
                            }
                        }
                    }
                }

                const pos = thisGroup.filter(t => t.tx.value > 0).length;
                const neg = thisGroup.filter(t => t.tx.value < 0).length;
                const zero = thisGroup.filter(t => t.tx.value === 0).length;

                let bundleResult = "";

                if (milestoneIndex >= 0) {
                    bundleResult = "It's a milestone";
                } else {
                    if (zero === thisGroup.length) {
                        bundleResult = "Contains data, but does not transfer IOTA.";
                    } else {
                        const isConfirmed = this.state.confirmationState === "confirmed"
                            ? "Transferred"
                            : "Attempting to transfer";
                        bundleResult = `${isConfirmed} IOTA from ${neg} input address${
                            neg > 1 ? "s" : ""} to ${pos} output address${pos > 1 ? "s" : ""}.`;
                    }
                }

                // See if we can create a longer message using all of the transactions in this group
                let message = this.state.message;
                let messageType = this.state.messageType;
                let messageSpans = this.state.messageSpans;

                const wholeMessage = thisGroup.map(t => t.tx.signatureMessageFragment).join("");

                const wholeDecoded = TrytesHelper.decodeMessage(wholeMessage);

                if ((wholeDecoded.messageType === "ASCII" ||
                    wholeDecoded.messageType === "JSON") &&
                    wholeDecoded.message !== this.state.message) {
                    message = wholeDecoded.message;
                    messageType = wholeDecoded.messageType;
                    messageSpans = true;
                }

                const isValid = isBundle(thisGroup.map(t => t.tx));

                if (this._mounted) {
                    this.setState(
                        {
                            isBundleValid: isValid ? true : false,
                            bundleResult,
                            message,
                            messageType,
                            messageSpans,
                            nextTransactionHash:
                                this.state.tx.currentIndex < this.state.tx.lastIndex ?
                                    this.state.tx.trunkTransaction : undefined,
                            prevTransactionHash: thisIndex > 0 ? thisGroup[thisIndex - 1].tx.hash : undefined,
                            milestoneIndex
                        });
                }
            }
        }
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;

        if (this._dateTimer) {
            clearInterval(this._dateTimer);
            this._dateTimer = undefined;
        }

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
        const network = this.props.network === this._networks[0].network ? "" : `/${this.props.network}`;

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
                                `/qr-create/${this.state.tx.address}${this.state.addressChecksum}/${
                                this.state.tx.value}/${this.state.messageType === "ASCII" ? this.state.message
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
                        <div className="row">
                            <div className="col">
                                <div className="label">Currency</div>
                                <div className="value">
                                    <InlineCurrency valueIota={this.state.tx.value} />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Address</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/address/${this.state.tx.address}${network}`}
                                    >
                                        {this.state.tx.address}
                                        <span className="checksum">{this.state.addressChecksum}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        {!this.props.hideInteractive && (
                            <div className="row">
                                {this.state.milestoneIndex !== -1 && (
                                    <div className="col">
                                        <div className="label">Milestone</div>
                                        <div className="value milestone">
                                            {this.state.milestoneIndex}
                                        </div>
                                    </div>
                                )}
                                {this.state.milestoneIndex === -1 && (
                                    <div className="col">
                                        <div className="label">Status</div>
                                        <div className="value">
                                            <Confirmation state={this.state.confirmationState} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <hr />
                        <Heading level={3}>Bundle</Heading>
                        {!this.props.hideInteractive && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">Is Valid</div>
                                    <div
                                        className={`value ${
                                            this.state.isBundleValid === undefined ? "unknown" :
                                                this.state.isBundleValid ? "yes" : "no"
                                            }`}
                                    >
                                        {this.state.isBundleValid === undefined ? "Validating..." :
                                            this.state.isBundleValid ? "Yes" : "No - This bundle will never confirm"
                                        }
                                    </div>
                                    <div>
                                        {this.state.isBundleValid &&
                                            this.state.bundleResult
                                        }
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="row">
                            <div className="col">
                                <div className="label">Bundle Hash</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/bundle/${this.state.tx.bundle}${network}`}
                                    >
                                        {this.state.tx.bundle}
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
                                        {this.state.tx.currentIndex} / {
                                            this.state.tx.lastIndex}
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
                        <Heading level={3}>Content</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Tag</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/tag/${this.state.tx.tag}${network}`}
                                    >
                                        {this.state.tx.tag}
                                    </Link>
                                </div>
                            </div>
                            <div className="col">
                                <div className="label">Obsolete Tag</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/tag/${this.state.tx.obsoleteTag}${network}`}
                                    >
                                        {this.state.tx.obsoleteTag}
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
                                            {this.state.tx.signatureMessageFragment}
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
                                                    this.state.tx.signatureMessageFragment :
                                                    this.state.message)}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <hr />
                        <Heading level={3}>Parents</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Trunk</div>
                                <div className="value">
                                    <Link
                                        className="nav-link"
                                        to={`/transaction/${this.state.tx.trunkTransaction}${network}`}
                                    >
                                        {this.state.tx.trunkTransaction}
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
                                        to={`/transaction/${this.state.tx.branchTransaction}${network}`}
                                    >
                                        {this.state.tx.branchTransaction}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <hr />
                        <Heading level={3}>PoW</Heading>
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
                                <div className="value">{this.state.tx.nonce}</div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Lower Bound</div>
                                <div className="value">
                                    {this.state.tx.attachmentTimestampLowerBound}
                                </div>
                            </div>
                            <div className="col">
                                <div className="label">Upper Bound</div>
                                <div className="value">
                                    {this.state.tx.attachmentTimestampUpperBound}
                                </div>
                            </div>
                        </div>
                        {!this.props.hideInteractive && (
                            <React.Fragment>
                                <hr />
                                <Heading level={3}>Raw</Heading>
                                <div className="row">
                                    <div className="col top">
                                        <div className="label">Trytes</div>
                                        <div className="value"><pre className="trytes">{this.state.trytes}</pre></div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col">
                                        <div className="label">&nbsp;</div>
                                        <div className="value">
                                            <Button
                                                color="secondary"
                                                size="small"
                                                onClick={() => ClipboardHelper.copy(this.state.trytes)}
                                            >
                                                Copy
                                            </Button>
                                            <Link
                                                className="button button--secondary button--small"
                                                to={`/compress/${this.state.trytes}`}
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
}

export default TransactionObject;
