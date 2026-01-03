import { PutObjectCommand } from "@aws-sdk/client-s3";
import { bucket, s3 } from "../config/s3";
import { env } from "../config/env";

class FileUploadUtils {
  uploadToS3 = async (fileContent: Buffer, key: string, contentType: string) => {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
        ACL: "public-read",
      }),
    );

    return `https://${bucket}.s3.${env.S3_BUCKET_REGION}.amazonaws.com/${key}`;
  };
}
const fileUploadUtils = new FileUploadUtils();
export default fileUploadUtils;