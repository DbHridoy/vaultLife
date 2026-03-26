import { Errors } from "../../constants/error-codes";
import { HttpCodes } from "../../constants/status-codes";
import { apiError } from "../../errors/api-error";
import { CommonRepository } from "./common.repository";
import { createCommonType, updateCommonType } from "./common.type";

export class CommonService {
  constructor(private commonRepo: CommonRepository) {}

  private normalizeContent = async (content: any) => {
    if (!content) {
      return {
        aboutUs: "",
        termsAndCondition: "",
        privacyPolicy: "",
      };
    }

    if (!content.privacyPolicy && content.servicePolicy) {
      content.privacyPolicy = content.servicePolicy;
      await content.save();
    }

    return {
      _id: content._id,
      aboutUs: content.aboutUs ?? "",
      termsAndCondition: content.termsAndCondition ?? "",
      privacyPolicy: content.privacyPolicy ?? "",
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  };

  getContent = async () => {
    const rawContent = await this.commonRepo.getContent();
    return await this.normalizeContent(rawContent);
  };

  createContent = async (body: createCommonType) => {
    const existingContent = await this.commonRepo.getContent();

    if (existingContent) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "Common content already exists. Use update instead."
      );
    }

    const content = await this.commonRepo.createContent(body);
    return await this.normalizeContent(content);
  };

  updateContent = async (body: updateCommonType) => {
    const existingContent = await this.commonRepo.getContent();

    if (!existingContent) {
      if (
        !body.aboutUs ||
        !body.termsAndCondition ||
        !body.privacyPolicy
      ) {
        throw new apiError(
          HttpCodes.BadRequest,
          "Common content does not exist yet. Use POST /common or provide all required fields."
        );
      }

      const content = await this.commonRepo.createContent(body as createCommonType);
      return await this.normalizeContent(content);
    }

    const normalizedBody = { ...body };

    if (
      !normalizedBody.privacyPolicy &&
      existingContent.servicePolicy &&
      !existingContent.privacyPolicy
    ) {
      normalizedBody.privacyPolicy = existingContent.servicePolicy;
    }

    const content = await this.commonRepo.updateContent(normalizedBody);
    return await this.normalizeContent(content);
  };
}
