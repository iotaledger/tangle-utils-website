export interface AreaCodeMapState {
    /**
     * Tag for the transaction.
     */
    areaCode: string;

    /**
     * The latitude clicked on the map.
     */
    latitude?: number;

    /**
     * The longitude clicked on the map.
     */
    longitude?: number;

    /**
     * The default zoom.
     */
    zoom?: number;

    /**
     * The clicked longitude.
     */
    clickedLng?: number;

    /**
     * The clicked latitude.
     */
    clickedLat?: number;

    /**
     * Has the api loaded
     */
    apiLoaded: boolean;

    /**
     * Are we finding the location.
     */
    findingLocation: boolean;
}
