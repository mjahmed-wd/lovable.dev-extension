import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type TestResult = 'pass' | 'fail' | 'pending';
export type Priority = 'low' | 'medium' | 'high';

export interface TestStep {
  id: string;
  description: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: TestStep[];
  expectedResult: string;
  priority: Priority;
  result: TestResult;
  executedAt?: Date;
  notes?: string;
  createdAt: Date;
}

interface TestCaseStore {
  testCases: TestCase[];
  addTestCase: (testCase: Omit<TestCase, 'id' | 'createdAt' | 'result'>) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  deleteTestCase: (id: string) => void;
  updateTestResult: (id: string, result: TestResult) => void;
}

export const useTestCaseStore = create<TestCaseStore>()(
  persist(
    (set, get) => ({
      testCases: [],
      
      addTestCase: (testCase) => {
        const newTestCase: TestCase = {
          ...testCase,
          id: uuidv4(),
          result: 'pending',
          createdAt: new Date(),
        };
        set((state) => ({
          testCases: [...state.testCases, newTestCase],
        }));
      },
      
      updateTestCase: (id, updates) => {
        set((state) => ({
          testCases: state.testCases.map((testCase) =>
            testCase.id === id
              ? { ...testCase, ...updates }
              : testCase
          ),
        }));
      },
      
      deleteTestCase: (id) => {
        set((state) => ({
          testCases: state.testCases.filter((testCase) => testCase.id !== id),
        }));
      },
      
      updateTestResult: (id, result) => {
        set((state) => ({
          testCases: state.testCases.map((testCase) =>
            testCase.id === id
              ? {
                  ...testCase,
                  result,
                  executedAt: new Date(),
                }
              : testCase
          ),
        }));
      },
    }),
    {
      name: 'testcase-storage',
    }
  )
); 