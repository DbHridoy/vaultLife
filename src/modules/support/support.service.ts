import { SupportRepository } from "./support.repository";
import { createSupportType } from "./support.type";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";

export class SupportService {
  constructor(private supportRepository: SupportRepository) {}

  createReport = async (userId: string, payload: createSupportType) => {
    return await this.supportRepository.createReport({
      userId,
      ...payload,
      status: "open",
    });
  };

  getMyReports = async (userId: string) => {
    return await this.supportRepository.getReportsByUserId(userId);
  };

  getAllReports = async () => {
    return await this.supportRepository.getAllReports();
  };

  getReportById = async (id: string) => {
    const report = await this.supportRepository.getReportById(id);

    if (!report) {
      throw new apiError(Errors.NotFound.code, "Support report not found");
    }

    return report;
  };

  updateReportStatus = async (id: string, status: string) => {
    const report = await this.supportRepository.updateReportStatus(id, status);

    if (!report) {
      throw new apiError(Errors.NotFound.code, "Support report not found");
    }

    return report;
  };
}
