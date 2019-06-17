import isBundle from "@iota/bundle-validator";
import { addChecksum } from "@iota/checksum";
import { asTransactionObject, Transaction } from "@iota/transaction-converter";
import { isEmpty } from "@iota/validators";
import { ClipboardHelper, Heading } from "iota-react-components";
import moment from "moment";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { TrytesHelper } from "../../helpers/trytesHelper";
import { UnitsHelper } from "../../helpers/unitsHelper";
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
     * Create a new instance of TransactionObject.
     * @param props The props.
     */
    constructor(props: TransactionObjectProps) {
        super(props);

        this._tangleCacheService = ServiceFactory.get<TangleCacheService>("tangle-cache");

        const transactionObject = asTransactionObject(this.props.trytes);

        const decoded = TrytesHelper.decodeMessage(transactionObject.signatureMessageFragment);

        this.state = {
            transactionObject,
            confirmationState: "unknown",
            time: moment(transactionObject.timestamp * 1000),
            value: UnitsHelper.formatBest(transactionObject.value),
            isMissing: isEmpty(this.props.trytes),
            message: decoded.message,
            messageType: decoded.messageType,
            messageShowRaw: false,
            messageSpans: false,
            attachmentTime: moment(transactionObject.attachmentTimestamp),
            addressChecksum: addChecksum(transactionObject.address).substr(-9),
            bundleResult: ""
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        const confirmationStates = await this._tangleCacheService.getTransactionConfirmationStates([this.props.hash], this.props.network);

        this.setState({
            confirmationState: confirmationStates[0],
            nextTransactionHash: this.state.transactionObject.currentIndex < this.state.transactionObject.lastIndex ?
                this.state.transactionObject.trunkTransaction : undefined
        });

        const thisGroup: ReadonlyArray<Transaction> = await this._tangleCacheService.getTransactionBundleGroup(this.state.transactionObject, this.props.network);

        if (thisGroup) {
            const thisIndex = thisGroup.findIndex(t => t.hash === this.state.transactionObject.hash);
            if (thisIndex > 0) {
                this.setState({
                    prevTransactionHash: thisGroup[thisIndex - 1].hash
                });
            }

            const pos = thisGroup.filter(t => t.value > 0).length;
            const neg = thisGroup.filter(t => t.value < 0).length;
            const zero = thisGroup.filter(t => t.value === 0).length;

            let bundleResult = "";

            if (pos === 1 && neg === 1 && zero === 0) {
                bundleResult = "Does not transfer any IOTA.";
            } else if (zero === thisGroup.length) {
                bundleResult = "Contains data, but does not transfer IOTA.";
            } else {
                bundleResult = `Transfers IOTA from ${pos} input address${pos > 1 ? "s" : ""} to ${neg} output address${neg > 1 ? "s" : ""}.`;
            }

            // If we are viewing the first index in the bundle see if we can
            // create a longer message using all of the transactions in this group
            let message = this.state.message;
            let messageType = this.state.messageType;
            let messageSpans = this.state.messageSpans;

            if (this.state.transactionObject.currentIndex === 0) {
                const wholeMessage = thisGroup.map(t => t.signatureMessageFragment).join("");

                const wholeDecoded = TrytesHelper.decodeMessage(wholeMessage);

                if ((wholeDecoded.messageType === "ASCII" ||
                    wholeDecoded.messageType === "JSON") &&
                    wholeDecoded.message !== this.state.message) {
                    message = wholeDecoded.message;
                    messageType = wholeDecoded.messageType;
                    messageSpans = true;
                }
            }

            const isValid = isBundle(thisGroup);
            this.setState({
                isBundleValid: isValid ? true : false,
                bundleResult,
                message,
                messageType,
                messageSpans
            });
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
                        <button className="link-button" onClick={() => ClipboardHelper.copy(this.props.hash)}>Copy</button>
                        <Link
                            className="link-button"
                            to={
                                `/qr-create/${state.transactionObject.address}${state.addressChecksum}/${state.transactionObject.value}/${state.messageType === "ASCII" ? state.message : ""}`
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
                                {this.state.time.format("LLLL")} - {moment.duration(moment().diff(this.state.time)).humanize()} ago
                            </div>
                            <div className="col right">
                                <Confirmation state={this.state.confirmationState} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Value</div>
                                <div className="value">{this.state.value}</div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Address</div>
                                <div className="value">
                                    <Link to={`/address/${this.state.transactionObject.address}${network}`}>{this.state.transactionObject.address}
                                        <span className="checksum">{this.state.addressChecksum}</span></Link>
                                </div>
                            </div>
                        </div>
                        <hr />
                        <Heading level={2}>Bundle</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Bundle Hash</div>
                                <div className="value"><Link to={`/bundle/${this.state.transactionObject.bundle}${network}`}>{this.state.transactionObject.bundle}</Link></div>
                            </div>
                        </div>
                        {/* <div className="row">
                            <div className="col">
                                <div className="label">Result</div>
                                <div className="value">{this.state.bundleResult}</div>
                            </div>
                        </div> */}
                        <div className="row">
                            <div className="col">
                                <div className="label">Index</div>
                                <div className="value">
                                    {this.state.prevTransactionHash && (
                                        <React.Fragment>
                                            <Link className="link-button" to={`/transaction/${this.state.prevTransactionHash}${network}`}>Prev</Link>
                                            &nbsp;
                                        </React.Fragment>
                                    )}
                                    {this.state.transactionObject.currentIndex} / {this.state.transactionObject.lastIndex}
                                    {this.state.nextTransactionHash && (
                                        <React.Fragment>
                                            &nbsp;
                                            <Link className="link-button" to={`/transaction/${this.state.nextTransactionHash}${network}`}>Next</Link>
                                        </React.Fragment>
                                    )}
                                </div>
                            </div>
                            {this.state.isBundleValid !== undefined && (
                                <div className="col">
                                    <div className="label">Is Valid</div>
                                    <div className={`value ${this.state.isBundleValid ? "success" : "danger"}`}>{this.state.isBundleValid ? "Yes" : "No - This bundle will never confirm"}</div>
                                </div>
                            )}
                        </div>
                        <hr />
                        <Heading level={2}>Content</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Tag</div>
                                <div className="value"><Link to={`/tag/${this.state.transactionObject.tag}${network}`}>{this.state.transactionObject.tag}</Link></div>
                            </div>
                            <div className="col">
                                <div className="label">Obsolete Tag</div>
                                <div className="value">{this.state.transactionObject.obsoleteTag}</div>
                            </div>
                        </div>
                        {!this.state.messageShowRaw && (
                            <div className="row top">
                                <div className="col top fill">
                                    <div className="label">Message<br />{this.state.messageType}</div>
                                    <div className="value fill"><pre className={this.state.messageType.toLowerCase()}>{this.state.message}</pre></div>
                                </div>
                            </div>
                        )}
                        {this.state.messageShowRaw && (
                            <div className="row top">
                                <div className="col top fill">
                                    <div className="label">Message<br />{this.state.messageType}</div>
                                    <div className="value fill"><pre className="trytes">{this.state.transactionObject.signatureMessageFragment}</pre></div>
                                </div>
                            </div>
                        )}
                        {this.state.messageSpans && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">&nbsp;</div>
                                    <div className="value fill">This message was constructed using all of the fragments in the bundle.</div>
                                </div>
                            </div>
                        )}
                        {this.state.messageType !== "Trytes" && (
                            <div className="row">
                                <div className="col">
                                    <div className="label">&nbsp;</div>
                                    <div className="value">
                                        <button
                                            className="link-button"
                                            onClick={() => this.setState({ messageShowRaw: !this.state.messageShowRaw })}
                                        >
                                            {this.state.messageShowRaw ? "Hide" : "Show"} Raw
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <hr />
                        <Heading level={2}>Parents</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Trunk</div>
                                <div className="value"><Link to={`/transaction/${this.state.transactionObject.trunkTransaction}${network}`}>{this.state.transactionObject.trunkTransaction}</Link></div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Branch</div>
                                <div className="value"><Link to={`/transaction/${this.state.transactionObject.branchTransaction}${network}`}>
                                    {this.state.transactionObject.branchTransaction}</Link></div>
                            </div>
                        </div>
                        <hr />
                        <Heading level={2}>PoW</Heading>
                        <div className="row">
                            <div className="col">
                                <div className="label">Timestamp</div>
                                <div className="value">{this.state.attachmentTime.format("LLLL")} - {moment.duration(moment().diff(this.state.attachmentTime)).humanize()} ago</div>
                            </div>
                            <div className="col">
                                <div className="label">Nonce</div>
                                <div className="value">{this.state.transactionObject.nonce}</div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <div className="label">Lower Bound</div>
                                <div className="value">{this.state.transactionObject.attachmentTimestampLowerBound}</div>
                            </div>
                            <div className="col">
                                <div className="label">Upper Bound</div>
                                <div className="value">{this.state.transactionObject.attachmentTimestampUpperBound}</div>
                            </div>
                        </div>
                        {!this.props.hideRaw && (
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
                                            <Link className="link-button" to={`/compress/${this.props.trytes}`}>View Compression Statistics</Link>
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
