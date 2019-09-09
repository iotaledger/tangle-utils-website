import * as IotaAreaCodes from "@iota/area-codes";
import { Fieldrow, Fieldset, Form, Heading, Input } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import AreaCodeMap from "../components/AreaCodeMap";
import "./AreaCodes.scss";
import { AreaCodesProps } from "./AreaCodesProps";
import { AreaCodesState } from "./AreaCodesState";

/**
 * Component which will show simple area codes.
 */
class AreaCodes extends Component<AreaCodesProps, AreaCodesState> {
    /**
     * Create a new instance of AreaCodes.
     * @param props The props.
     */
    constructor(props: AreaCodesProps) {
        super(props);

        let paramIac = "";

        if (this.props.match && this.props.match.params) {
            if (this.props.match.params.iac) {
                paramIac = this.props.match.params.iac;
            }
        }

        this.state = {
            areaCode: paramIac,
            areaCodeValidation: "",
            mapAreaCode: ""
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        if (this.state.areaCode && this.state.areaCode.length > 0) {
            this.updateIac(this.state.areaCode);
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="area-codes">
                <Heading level={1}>Area Code Finder</Heading>
                <p>Fill in the IOTA Area Code to show it on the map, on click the map to find the IOTA Area Code.</p>
                <Form>
                    <Fieldset>
                        <label>Area Code</label>
                        <Input
                            type="text"
                            value={this.state.areaCode}
                            onChange={e => this.updateIac(e.target.value)}
                            restrict="trytes"
                            maxLength={14}
                            placeholder="Please enter IOTA Area code"
                        />
                    </Fieldset>
                    {this.state.areaCodeValidation && (
                        <Fieldrow>
                            <div className="danger">{this.state.areaCodeValidation}</div>
                        </Fieldrow>
                    )}
                    <AreaCodeMap
                        iac={this.state.mapAreaCode}
                        onChanged={iac =>
                            this.setState({ areaCode: iac, mapAreaCode: iac })}
                    />
                </Form>
            </div>
        );
    }

    /**
     * Validate the data
     * @param iac The iac to update to.
     */
    private updateIac(iac: string): void {
        const localIac = IotaAreaCodes.padPartial(iac);
        const areaCodeValidation = IotaAreaCodes.isValidPartial(localIac) ?
            "" : `The IOTA Area Code is not valid`;

        this.setState({
            areaCodeValidation,
            areaCode: iac
        });

        this.setState({ mapAreaCode: areaCodeValidation.length === 0 ? localIac : "" });
    }
}

export default AreaCodes;
