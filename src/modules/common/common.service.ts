import { Errors } from "../../constants/error-codes";
import { apiError } from "../../errors/api-error";
import { CommonRepository } from "./common.repository";
import { createCommonType, updateCommonType } from "./common.type";

export class CommonService {
  constructor(private commonRepo: CommonRepository) {}

  getContent = async () => {
    const content = await this.commonRepo.getContent();

    if (!content) {
      throw new apiError(Errors.NotFound.code, "Common content not found");
    }

    return content;
  };

  createContent = async (body: createCommonType) => {
    const existingContent = await this.commonRepo.getContent();

    if (existingContent) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "Common content already exists. Use update instead."
      );
    }

    return await this.commonRepo.createContent(body);
  };

  updateContent = async (body: updateCommonType) => {
    return await this.commonRepo.updateContent(body);
  };
}
