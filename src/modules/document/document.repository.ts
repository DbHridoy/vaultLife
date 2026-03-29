import Document from "./document.model";
import { buildDynamicSearch } from "../../utils/dynamic-search-utils";
import { DocumentListQuery, DocumentListResult } from "./document.type";

export class DocumentRepository {
  createDocument = async (payload: Record<string, unknown>) => {
    const document = new Document(payload);
    return await document.save();
  };

  getAllDocuments = async (
    query: DocumentListQuery = {},
    baseFilter: Record<string, unknown> = {}
  ): Promise<DocumentListResult> => {
    const { filter, search, options } = buildDynamicSearch(Document, query);
    const mongoQuery = {
      ...baseFilter,
      ...filter,
      ...search,
    };

    const [documents, total] = await Promise.all([
      Document.find(mongoQuery, null, options),
      Document.countDocuments(mongoQuery),
    ]);

    return { data: documents, total };
  };

  getDocumentById = async (id: string) => {
    return await Document.findById(id);
  };

  updateDocument = async (id: string, payload: Record<string, unknown>) => {
    return await Document.findByIdAndUpdate(id, payload, { new: true });
  };

  deleteDocument = async (id: string) => {
    return await Document.findByIdAndDelete(id);
  };
}
