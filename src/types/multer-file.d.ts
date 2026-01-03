import 'multer';

declare module 'multer' {
  interface File {
    fileUrl?: string;
  }
}

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fileUrl?: string;
      }
    }
  }
}