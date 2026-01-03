import { Request } from "express";
import { Multer } from 'multer';

// Extend the Multer File type to include fileUrl
export interface MulterFileWithUrl extends Express.Multer.File {
  fileUrl?: string;
}

// This is the type for req.file
export type MulterFile = Express.Multer.File & { fileUrl?: string };

// This is the type for req.files when using .array() or .fields()
export type MulterFiles = { [fieldname: string]: MulterFile[] } | MulterFile[];

export type TypedRequestBody<T> = Request<{}, {}, T>;
export type TypedRequestParams<P, B = any> = Request<P, {}, B>;
export type TypedRequestQuery<Q> = Request<{}, {}, {}, Q>;

export type TypedRequestBodyWithFile<T> = Request<{}, {}, T> & {
  file?: MulterFile;
  files?: MulterFiles;
};