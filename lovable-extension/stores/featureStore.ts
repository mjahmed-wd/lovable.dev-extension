import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'pending' | 'in-progress' | 'done';

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

interface FeatureStore {
  features: Feature[];
  addFeature: (feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateFeature: (id: string, updates: Partial<Feature>) => void;
  deleteFeature: (id: string) => void;
  updateFeatureStatus: (id: string, status: Status) => void;
  addNoteToFeature: (featureId: string, content: string) => void;
  removeNoteFromFeature: (featureId: string, noteId: string) => void;
}

export const useFeatureStore = create<FeatureStore>()(
  persist(
    (set, get) => ({
      features: [],
      
      addFeature: (feature) => {
        const newFeature: Feature = {
          ...feature,
          id: uuidv4(),
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          features: [...state.features, newFeature],
        }));
      },
      
      updateFeature: (id, updates) => {
        set((state) => ({
          features: state.features.map((feature) =>
            feature.id === id
              ? { ...feature, ...updates, updatedAt: new Date() }
              : feature
          ),
        }));
      },
      
      deleteFeature: (id) => {
        set((state) => ({
          features: state.features.filter((feature) => feature.id !== id),
        }));
      },
      
      updateFeatureStatus: (id, status) => {
        set((state) => ({
          features: state.features.map((feature) =>
            feature.id === id
              ? { ...feature, status, updatedAt: new Date() }
              : feature
          ),
        }));
      },
      
      addNoteToFeature: (featureId, content) => {
        const newNote: Note = {
          id: uuidv4(),
          content,
          createdAt: new Date(),
        };
        
        set((state) => ({
          features: state.features.map((feature) =>
            feature.id === featureId
              ? {
                  ...feature,
                  notes: [...feature.notes, newNote],
                  updatedAt: new Date(),
                }
              : feature
          ),
        }));
      },
      
      removeNoteFromFeature: (featureId, noteId) => {
        set((state) => ({
          features: state.features.map((feature) =>
            feature.id === featureId
              ? {
                  ...feature,
                  notes: feature.notes.filter((note) => note.id !== noteId),
                  updatedAt: new Date(),
                }
              : feature
          ),
        }));
      },
    }),
    {
      name: 'feature-storage',
    }
  )
); 