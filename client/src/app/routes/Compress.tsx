import { compress } from "@iota/tryte-compress";
import { Fieldrow, Fieldset, Form, Heading, TextArea } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { CompressProps } from "./CompressProps";
import { CompressState } from "./CompressState";

/**
 * Component for compressing trytes.
 */
class Compress extends Component<CompressProps, CompressState> {
    /**
     * Create a new instance of Compress.
     * @param props The props.
     */
    constructor(props: CompressProps) {
        super(props);

        let paramTrytes = "";

        if (this.props.match && this.props.match.params) {
            if (this.props.match.params.trytes) {
                paramTrytes = this.props.match.params.trytes;
            }
        }

        this.state = {
            trytes: paramTrytes,
            trytesValidation: "",
            compressed: "",
            compressedLength: 0,
            originalLength: 0,
            savings: 0
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        if (this.state.trytes.length > 0) {
            await this.compress();
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <React.Fragment>
                <Heading level={1}>Trytes Compress</Heading>
                <Form>
                    <Fieldset>
                        <label>Trytes</label>
                        <TextArea
                            value={this.state.trytes}
                            onChange={(e) => this.setState({ trytes: e.target.value }, () => this.compress())}
                            rows={10}
                            placeholder="Enter trytes to compress"
                            restrict="trytes"
                        />
                    </Fieldset>
                    {this.state.trytesValidation && (
                        <Fieldrow>
                            <div className="danger">{this.state.trytesValidation}</div>
                        </Fieldrow>
                    )}
                    {this.state.compressed && (
                        <React.Fragment>
                            <hr />
                            <Fieldset>
                                <label>Compressed</label>
                                <textarea
                                    value={this.state.compressed}
                                    readOnly={true}
                                    rows={10}
                                />
                            </Fieldset>
                            <Fieldset>
                                <label>Original Length</label>
                                <span>{this.state.originalLength} Trytes</span>
                            </Fieldset>
                            <Fieldset>
                                <label>Compressed Length</label>
                                <span>{this.state.compressedLength} Bytes</span>
                            </Fieldset>
                            <Fieldset>
                                <label>Savings</label>
                                <span>{this.state.savings.toFixed(1)} %</span>
                            </Fieldset>
                        </React.Fragment>
                    )}
                </Form>
            </React.Fragment>
        );
    }

    /**
     * Compress the trytes.
     */
    private async compress(): Promise<void> {
        const isValid = this.validate();

        let compressionResult;
        let compressed = "";

        if (isValid) {
            try {
                compressionResult = compress(Buffer.from(this.state.trytes.toUpperCase()));
            } catch (err) {}

            if (compressionResult) {
                for (let i = 0; i < compressionResult.length; i++) {
                    compressed += compressionResult[i].toString(16).padStart(2, "0").toUpperCase();
                    if (i < compressionResult.length - 1) {
                        compressed += ", ";
                    }
                }
            }
        }

        this.setState({
            compressed,
            originalLength: this.state.trytes.length,
            compressedLength: compressionResult ? compressionResult.length : 0,
            savings: 100 - (compressionResult && compressionResult.length > 0 ? compressionResult.length / this.state.trytes.length * 100 : 0)
        });
    }

    /**
     * Decode the trytes into its fields.
     * @returns True if valid.
     */
    private validate(): boolean {
        let trytesValidation = "";

        const trytes = this.state.trytes.toUpperCase();

        if (trytes.length > 0) {
            if (!/^[9A-Z]*$/.test(trytes)) {
                trytesValidation = "Trytes must be characters A-Z or 9.";
            }
        }

        this.setState({
            trytesValidation
        });

        return trytesValidation.length === 0;
    }
}

export default Compress;
