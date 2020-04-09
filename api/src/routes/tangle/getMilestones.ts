import { ServiceFactory } from "../../factories/serviceFactory";
import { IGetMilestonesRequest } from "../../models/api/IGetMilestonesRequest";
import { IGetMilestonesResponse } from "../../models/api/IGetMilestonesResponse";
import { IConfiguration } from "../../models/configuration/IConfiguration";
import { MilestonesService } from "../../services/milestonesService";
import { ValidationHelper } from "../../utils/validationHelper";

/**
 * Get transactions for the requested hashes.
 * @param config The configuration.
 * @param request The request.
 * @returns The response.
 */
export async function getMilestones(config: IConfiguration, request: IGetMilestonesRequest)
    : Promise<IGetMilestonesResponse> {

    ValidationHelper.oneOf(request.network, config.networks.map(n => n.network), "network");

    const milestonesService = ServiceFactory.get<MilestonesService>("milestones");

    return {
        success: true,
        message: "OK",
        milestones: milestonesService.getMilestones(request.network)
    };
}
