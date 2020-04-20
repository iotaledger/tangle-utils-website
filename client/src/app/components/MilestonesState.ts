export interface MilestonesState {
    /**
     * The milestones.
     */
    milestones: {
        [id: string]: {
            /**
             * The transaction hash.
             */
            hash: string;
            /**
             * The milestone index.
             */
            milestoneIndex: number;
        }[]
    };
}
