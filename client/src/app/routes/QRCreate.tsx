import { isTrytes } from "@iota/validators";
import { AddressQR, TrinityPaymentQR } from "@tangle-frost/iota-qr-lib";
import { Fieldset, Form, FormActions, FormStatus, Heading, Input } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import "./QRCreate.scss";
import { QRCreateProps } from "./QRCreateProps";
import { QRCreateState } from "./QRCreateState";

/**
 * Component which will create a qr code.
 */
class QRCreate extends Component<QRCreateProps, QRCreateState> {
    /**
     * Create a new instance of QRCreate.
     * @param props The props.
     */
    constructor(props: QRCreateProps) {
        super(props);

        let paramAddress = "";
        let paramAmount = "";
        let paramMessage = "";

        if (this.props.match && this.props.match.params) {
            if (this.props.match.params.address) {
                paramAddress = this.props.match.params.address;
            }
            if (this.props.match.params.amount) {
                const amount = parseInt(this.props.match.params.amount, 10);
                if (!isNaN(amount)) {
                    paramAmount = this.props.match.params.amount;
                }
            }
            if (this.props.match.params.message) {
                paramMessage = this.props.match.params.message;
            }
        }

        this.state = {
            isBusy: false,
            isValid: false,
            isErrored: false,
            status: "",
            address: paramAddress,
            addressIsValid: false,
            amount: paramAmount,
            message: paramMessage,
            tag: ""
        };
    }

    /**
     * The component mounted.
     */
    public componentDidMount(): void {
        this.validate();

        if (this.state.address.length > 0) {
            this.qrCode();
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        // tslint:disable:react-no-dangerous-html
        // tslint:disable:react-a11y-input-elements
        return (
            <React.Fragment>
                <Heading level={1}>QR Create</Heading>
                <p>Please enter the details to generate the QR code, only the address is required.<br />
                    Once generated you will be able to scan the QR code into Trinity.</p>
                <Form>
                    <Fieldset>
                        <label>Address</label>
                        <Input
                            type="text"
                            placeholder="The address for the payment (90 Trytes)"
                            value={this.state.address}
                            onChange={e => this.setState({ address: e.target.value }, () => this.qrCode())}
                            maxLength={90}
                            readOnly={this.state.isBusy}
                            restrict="trytes"
                        />
                        <Link
                            className={`button no-min ${this.state.addressIsValid ? "" : "disabled"}`}
                            to={`/address/${this.state.address}`}
                        >
                            Explore
                        </Link>
                    </Fieldset>
                    <Fieldset>
                        <label>Amount</label>
                        <Input
                            type="text"
                            placeholder="Enter an amount in IOTAs"
                            value={this.state.amount}
                            onChange={e => this.setState(
                                { amount: e.target.value.replace(/[^0-9]/g, "") }, () => this.qrCode())}
                            readOnly={this.state.isBusy}
                            restrict="integer"
                        />
                    </Fieldset>
                    <Fieldset>
                        <label>Message</label>
                        <input
                            type="text"
                            placeholder="Enter a message to include"
                            value={this.state.message}
                            onChange={e => this.setState({ message: e.target.value }, () => this.qrCode())}
                            readOnly={this.state.isBusy}
                        />
                    </Fieldset>
                    {this.state.qrHtml && (
                        <Fieldset>
                            <label>QR</label>
                            <span dangerouslySetInnerHTML={{ __html: this.state.qrHtml }} />
                        </Fieldset>
                    )}
                    {this.state.qrDataPng && (
                        <FormActions>
                            {this.state.qrDataPng && (
                                <a
                                    className="button"
                                    href={`data:image/png;base64,${this.state.qrDataPng.toString("base64")}`}
                                    download="qr.png"
                                    role="button"
                                >
                                    Save As PNG
                                </a>
                            )}
                        </FormActions>
                    )}
                    {this.state.dataText && (
                        <Fieldset>
                            <label>QR Data</label>
                            <textarea rows={8} readOnly={true} value={this.state.dataText} />
                        </Fieldset>
                    )}
                    <FormStatus message={this.state.status} isBusy={this.state.isBusy} isError={this.state.isErrored} />
                </Form>
            </React.Fragment>
        );
    }

    /**
     * Validate the date.
     * @returns True if the data is valid.
     */
    private validate(): boolean {
        const addressIsValid = isTrytes(this.state.address.toUpperCase(), 90);
        this.setState({
            addressIsValid
        });
        return addressIsValid;
    }

    /**
     * Generate the QR Code.
     */
    private qrCode(): void {
        this.validate();

        this.setState(
            {
                isBusy: true,
                isErrored: false,
                status: "",
                dataText: undefined,
                qrHtml: "",
                qrDataPng: undefined
            },
            async () => {
                try {
                    let qrDataPng: Buffer;
                    let htmlElement: Element;
                    let dataText;
                    if (!this.state.amount) {
                        dataText = this.state.address.toUpperCase();

                        htmlElement = await AddressQR.renderHtml(
                            this.state.address.toUpperCase(),
                            "png",
                            5,
                            0,
                            {
                                cssClass: "qr"
                            });

                        qrDataPng = Buffer.from((await AddressQR.renderRaw(
                            this.state.address.toUpperCase(), "png", 5, 0)) as Uint8Array);
                    } else {
                        const paymentData = TrinityPaymentQR.generatePaymentData(
                            this.state.address.toUpperCase(),
                            parseInt(this.state.amount, 10),
                            this.state.tag,
                            this.state.message);

                        delete paymentData.tag;

                        dataText = JSON.stringify(paymentData, undefined, "\t");

                        htmlElement = await TrinityPaymentQR.renderHtml(
                            paymentData,
                            "png",
                            0,
                            5,
                            0,
                            {
                                cssClass: "qr"
                            });

                        qrDataPng = Buffer.from((await TrinityPaymentQR.renderRaw(
                            paymentData, "png", 0, 5, 0)) as Uint8Array);
                    }

                    this.setState({
                        isBusy: false,
                        dataText,
                        qrHtml: htmlElement.outerHTML,
                        qrDataPng
                    });
                } catch (err) {
                    this.setState({
                        isBusy: false,
                        isErrored: true,
                        status: err.message
                    });
                }
            });
    }
}

export default QRCreate;
