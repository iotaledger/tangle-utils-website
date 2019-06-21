import * as IotaAreaCodes from "@iota/area-codes";
import GoogleMapReact, { ClickEventValue } from "google-map-react";
import { Spinner } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IConfiguration } from "../../models/config/IConfiguration";
import { ConfigurationService } from "../../services/configurationService";
import "./AreaCodeMap.scss";
import { AreaCodeMapProps } from "./AreaCodeMapProps";
import { AreaCodeMapState } from "./AreaCodeMapState";

/**
 * Component which will show simple area codes.
 */
class AreaCodeMap extends Component<AreaCodeMapProps, AreaCodeMapState> {
    /**
     * The configuration.
     */
    private readonly _configuration: IConfiguration;

    /**
     * The map object.
     */
    private _map: any;

    /**
     * The maps object.
     */
    private _maps: any;

    /**
     * Map highlight polygon.
     */
    private _highlight: any;

    /**
     * Create a new instance of AreaCodeMap.
     * @param props The props.
     */
    constructor(props: AreaCodeMapProps) {
        super(props);

        this._configuration = ServiceFactory.get<ConfigurationService<IConfiguration>>("configuration").get();

        this.state = {
            areaCode: this.props.iac,
            apiLoaded: false
        };
    }

    /**
     * The component performed an update.
     * @param prevProps The previous properties.
     */
    public componentDidUpdate(prevProps: AreaCodeMapProps): void {
        if (prevProps.iac !== this.props.iac) {
            this.setState(
                {
                    areaCode: this.props.iac
                },
                () => {
                    if (this.state.apiLoaded) {
                        this.updateIac(this.state.areaCode);
                    }
                });
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="area-code-map">
                {!this.state.apiLoaded && (
                    <Spinner />
                )}
                <GoogleMapReact
                    bootstrapURLKeys={{ key: this._configuration.googleMapsKey }}
                    defaultCenter={{
                        lat: 52.529562,
                        lng: 13.413047
                    }}
                    center={{
                        lat: this.state.latitude || 52.529562,
                        lng: this.state.longitude || 13.413047
                    }}
                    defaultZoom={19}
                    zoom={this.state.zoom || 19}
                    onClick={(e) => this.mapClicked(e)}
                    onGoogleApiLoaded={(e) => this.apiLoaded(e.map, e.maps)}
                    yesIWantToUseGoogleMapApiInternals={true}
                    onChange={(e) => this.setState({ zoom: e.zoom })}
                />
            </div>
        );
    }

    /**
     * The google maps api was loaded capture the maps and map object.
     * @param map The map object.
     * @param maps The maps object.
     */
    private apiLoaded(map: any, maps: any): void {
        this._map = map;
        this._maps = maps;

        this.setState({ apiLoaded: true });

        this.updateIac(this.state.areaCode);
    }

    /**
     * The map was clicked.
     * @param event The click event.
     */
    private mapClicked(event: ClickEventValue): void {
        this.setState(
            {
                clickedLat: event.lat,
                clickedLng: event.lng
            },
            () => {
                if (this.state.clickedLat && this.state.clickedLng) {
                    this.updateIac(IotaAreaCodes.encode(this.state.clickedLat, this.state.clickedLng, IotaAreaCodes.CodePrecision.NORMAL));
                }
            }
        );
    }

    /**
     * Update based on iota area code.
     * @param iac The area code.
     */
    private updateIac(iac: string): void {
        if (IotaAreaCodes.isValid(iac)) {
            const area = IotaAreaCodes.decode(iac);

            this.setState({
                latitude: area.latitude,
                longitude: area.longitude,
                clickedLat: this.state.clickedLat || area.latitude,
                clickedLng: this.state.clickedLng || area.longitude,
                areaCode: iac,
                zoom: area.codePrecision === 2 ? 1 : area.codePrecision * 2
            });

            this.updateHighlight(area);

            this.props.onChanged(iac);
        } else {
            if (this._highlight) {
                this._highlight.setMap(undefined);
            }
        }
    }

    /**
     * Update the highlight on the map.
     * @param area The area to highlight.
     */
    private updateHighlight(area: IotaAreaCodes.IacCodeArea): void {
        if (this._highlight) {
            this._highlight.setMap(undefined);
        }

        this._highlight = new this._maps.Rectangle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map: this._map,
            bounds: {
                south: area.latitudeLow,
                north: area.latitudeHigh,
                west: area.longitudeLow,
                east: area.longitudeHigh
            }
        });
    }
}

export default AreaCodeMap;
