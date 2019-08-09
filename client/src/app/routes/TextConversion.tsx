import { Fieldrow, Fieldset, Form, Heading, TextArea } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { TextHelper } from "../../helpers/textHelper";
import { TextConversionProps } from "./TextConversionProps";
import { TextConversionState } from "./TextConversionState";

/**
 * Component which will convert text to trytes.
 */
class TextConversion extends Component<TextConversionProps, TextConversionState> {
    /**
     * Create a new instance of TextConversion.
     * @param props The props.
     */
    constructor(props: TextConversionProps) {
        super(props);

        let paramPlain = "";
        let paramTrytes = "";

        if (this.props.match.params && this.props.match.params.plainTextOrTrytes) {
            if (/^[9A-Z]*$/.test(this.props.match.params.plainTextOrTrytes)) {
                paramTrytes = this.props.match.params.plainTextOrTrytes;
            } else {
                paramPlain = this.props.match.params.plainTextOrTrytes;
            }
        }

        this.state = {
            plain: paramPlain,
            trytes: paramTrytes,
            errorMessage: ""
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        if (this.state.plain.length > 0) {
            this.plainToTrytes();
        } else if (this.state.trytes.length > 0) {
            this.trytesToPlain();
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <React.Fragment>
                <Heading level={1}>Text Conversion</Heading>
                <p>Please enter the text to convert to trytes, or the trytes to convert to text.
                    <br />
                    Characters outside the ASCII range (0-127) are escaped as Unicode characters</p>
                <Form>
                    <Fieldset>
                        <label>Plain Text</label>
                        <TextArea
                            value={this.state.plain}
                            onChange={e => this.setState({ plain: e.target.value }, () => this.plainToTrytes())}
                            rows={10}
                        />
                    </Fieldset>
                    <Fieldrow>
                        <div className={this.state.errorMessage ? "danger" : ""}>
                            {this.state.errorMessage ?
                                this.state.errorMessage : `${this.state.plain.length} characters`}
                        </div>
                    </Fieldrow>
                    <Fieldset>
                        <label>Trytes</label>
                        <TextArea
                            value={this.state.trytes}
                            onChange={e => this.setState({ trytes: e.target.value }, () => this.trytesToPlain())}
                            rows={10}
                            restrict="trytes"
                        />
                    </Fieldset>
                    <Fieldrow>{this.state.trytes.length} trytes</Fieldrow>
                </Form>
            </React.Fragment>
        );
    }

    /**
     * Convert the text to trytes.
     */
    private plainToTrytes(): void {
        this.setState({
            trytes: TextHelper.toTrytes(this.state.plain),
            errorMessage: ""
        });
    }

    /**
     * Convert the trytes to text.
     */
    private trytesToPlain(): void {
        try {
            const plain = TextHelper.fromTrytes(this.state.trytes.toUpperCase());
            this.setState({ plain, errorMessage: "" });
        } catch (err) {
            this.setState({ plain: "", errorMessage: err.message });
        }
    }

}

export default TextConversion;
