import Common from "./common.model";

export class CommonRepository {
  getContent = async () => {
    return await Common.findOne();
  };

  createContent = async (body: {
    aboutUs: string;
    termsAndCondition: string;
    privacyPolicy: string;
  }) => {
    const content = new Common(body);
    return await content.save();
  };

  updateContent = async (body: {
    aboutUs?: string;
    termsAndCondition?: string;
    privacyPolicy?: string;
  }) => {
    return await Common.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
  };
}
