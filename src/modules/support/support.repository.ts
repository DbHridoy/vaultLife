import Support from "./support.model";

export class SupportRepository {
  createReport = async (payload: Record<string, unknown>) => {
    const report = new Support(payload);
    return await report.save();
  };

  getAllReports = async () => {
    return await Support.find()
      .populate("userId resolvedBy")
      .sort({ createdAt: -1 });
  };

  getReportsByUserId = async (userId: string) => {
    return await Support.find({ userId }).sort({ createdAt: -1 });
  };

  getReportById = async (id: string) => {
    return await Support.findById(id).populate("userId resolvedBy");
  };

  updateReportStatus = async (id: string, status: string) => {
    return await Support.findByIdAndUpdate(id, { status }, { new: true }).populate(
      "userId resolvedBy"
    );
  };

  resolveReport = async (
    id: string,
    payload: Record<string, unknown>
  ) => {
    return await Support.findByIdAndUpdate(id, payload, {
      new: true,
    }).populate("userId resolvedBy");
  };
}
