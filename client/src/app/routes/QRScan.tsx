import { isTrytes } from "@iota/validators";
import { Button, Fieldset, Form, FormActions, Heading, QRReader } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { QRScanState } from "./QRScanState";

/**
 * Component which will scan a qr code.
 */
class QRScan extends Component<any, QRScanState> {
    /**
     * Create a new instance of Scan.
     * @param props The props.
     */
    constructor(props: any) {
        super(props);

        this.state = {
            showScanner: false,
            isErrored: false,
            status: "",
            address: "",
            amount: "",
            message: ""
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        // tslint:disable:react-a11y-input-elements
        return (
            <React.Fragment>
                <Heading level={1}>QR Code Scanner</Heading>
                <p>Try scanning a QR Code, if it has IOTA data it will be extracted.</p>
                <Form>
                    <Fieldset>
                        <Button
                            color="primary"
                            onClick={() => this.setState({ showScanner: true })}
                        >
                            Scan QR Code
                        </Button>
                    </Fieldset>
                    {this.state.dataText && (
                        <Fieldset>
                            <label>QR Data</label>
                            <textarea rows={8} readOnly={true} value={this.state.dataText} />
                        </Fieldset>
                    )}
                    {this.state.address && (
                        <React.Fragment>
                            <Fieldset>
                                <label>Address</label>
                                <span>{this.state.address}</span>
                            </Fieldset>
                            <FormActions>
                                <Link className="button no-min" to={`/address/${this.state.address}`}>Explore</Link>
                            </FormActions>
                        </React.Fragment>
                    )}
                    {this.state.amount && (
                        <Fieldset>
                            <label>Amount</label>
                            <span>{this.state.amount}</span>
                        </Fieldset>
                    )}
                    {this.state.message && (
                        <Fieldset>
                            <label>Message</label>
                            <span>{this.state.message}</span>
                        </Fieldset>
                    )}
                </Form>
                {this.state.showScanner && (
                    <QRReader displayMode="fill" onData={data => this.qrData(data)} />
                )}
            </React.Fragment>
        );
    }

    /**
     * Process the qr data from the scanner.
     * @param data The data.
     */
    private qrData(data: any): void {
        this.setState(
            {
                showScanner: false,
                dataText: data,
                address: "",
                amount: "",
                message: ""
            },
            () => {
                try {
                    const json = JSON.parse(data);

                    this.setState({
                        address: json && json.address,
                        amount: json && json.amount,
                        message: json && json.message
                    });
                } catch (err) {
                    const addressIsValid = isTrytes(data, 90);
                    if (addressIsValid) {
                        this.setState({
                            address: data
                        });
                    }
                }
            }
        );
    }
}

export default QRScan;
