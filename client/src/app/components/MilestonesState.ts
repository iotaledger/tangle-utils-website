
export interface MilestonesState {
    /**
     * The milestones from mainNet.
     */
    mainnetMilestones: {
        /**
         * The transaction hash.
         */
        hash: string;
        /**
         * The milestone index.
         */
        milestoneIndex: number;
    }[];

    /**
     * The milestones from devNet.
     */
    devnetMilestones: {
        /**
         * The transaction hash.
         */
        hash: string;
        /**
         * The milestone index.
         */
        milestoneIndex: number;
    }[];
}
