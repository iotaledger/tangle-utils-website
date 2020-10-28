import * as IotaAreaCodes from "@iota/area-codes";
import { addChecksum } from "@iota/checksum";
import { trytesToTrits } from "@iota/converter";
import { Transaction } from "@iota/core";
import { asTransactionObject } from "@iota/transaction-converter";
import { Button, ClipboardHelper, Heading } from "iota-react-components";
import moment from "moment";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { TrytesHelper } from "../../helpers/trytesHelper";
import { UnitsHelper } from "../../helpers/unitsHelper";
import { ConfirmationState } from "../../models/confirmationState";
import "./TransactionObject.scss";
import { TransactionObjectProps } from "./TransactionObjectProps";
import { TransactionObjectState } from "./TransactionObjectState";

/**
 * Component which will display a transaction.
 */
class TransactionObject extends Component<TransactionObjectProps, TransactionObjectState> {
    /**
     * Timer for date counter;
     */
    private _dateTimer?: NodeJS.Timer;

    /**
     * Create a new instance of TransactionObject.
     * @param props The props.
     */
    constructor(props: TransactionObjectProps) {
        super(props);

        let tx: Transaction | undefined;
        let trytes: string | undefined;
        let confirmationState: ConfirmationState | undefined;

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
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        if (this._dateTimer) {
            clearInterval(this._dateTimer);
            this._dateTimer = undefined;
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
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
                                this.state.tx.value}/${this.state.messageType === "ASCII" ? encodeURIComponent(this.state.message)
                                    : ""}`
                            }
                        >
                            QR
                        </Link>
                    </div>
                </div>
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
                            <div className="label">Address</div>
                            <div className="value">
                                {this.state.tx.address}
                                <span className="checksum">{this.state.addressChecksum}</span>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <Heading level={3}>Bundle</Heading>
                    <div className="row">
                        <div className="col">
                            <div className="label">Bundle Hash</div>
                            <div className="value">
                                {this.state.tx.bundle}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            <div className="label">Index</div>
                            <div className="value">
                                <div className="index">
                                    {this.state.tx.currentIndex} / {
                                        this.state.tx.lastIndex}
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <Heading level={3}>Content</Heading>
                    <div className="row">
                        <div className="col">
                            <div className="label">Tag</div>
                            <div className="value">
                                {this.state.tx.tag}
                            </div>
                        </div>
                        <div className="col">
                            <div className="label">Obsolete Tag</div>
                            <div className="value">
                                {this.state.tx.obsoleteTag}
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
                                {this.state.tx.trunkTransaction}
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            <div className="label">Branch</div>
                            <div className="value">
                                {this.state.tx.branchTransaction}
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
                </React.Fragment>
            </div>
        );
    }
}

export default TransactionObject;
