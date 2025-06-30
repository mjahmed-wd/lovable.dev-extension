import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DocumentType = 'requirements' | 'specs' | 'guides' | 'api' | 'faq';

export interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  createdAt: Date;
  url?: string;
}

interface DocumentStore {
  documents: GeneratedDocument[];
  addDocument: (document: Omit<GeneratedDocument, 'id'>) => void;
  deleteDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<GeneratedDocument>) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      documents: [],
      
      addDocument: (document) => {
        const newDocument: GeneratedDocument = {
          ...document,
          id: Date.now().toString(),
        };
        set((state) => ({
          documents: [newDocument, ...state.documents],
        }));
      },
      
      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        }));
      },
      
      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc
          ),
        }));
      },
    }),
    {
      name: 'document-storage',
    }
  )
); 