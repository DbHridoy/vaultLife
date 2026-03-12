import Document from "./document.model";

export class DocumentRepository {
  createDocument = async (payload: Record<string, unknown>) => {
    const document = new Document(payload);
    return await document.save();
  };

  getAllDocuments = async () => {
    return await Document.find().sort({ createdAt: -1 });
  };

  getDocumentById = async (id: string) => {
    return await Document.findById(id);
  };
}
