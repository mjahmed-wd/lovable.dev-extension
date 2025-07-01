import React, { useState } from 'react';
import { List, TestTube, FileText, Users } from 'lucide-react';

import FeatureList from './FeatureList';
import TestCases from './TestCases';
import DocumentGeneration from './DocumentGeneration';
import ExpertHub from './ExpertHub';
import { useFeatureStore } from '../stores/featureStore';
import { useTestCaseStore } from '../stores/testCaseStore';
import { useDocumentStore } from '../stores/documentStore';

type TabType = 'features' | 'tests' | 'docs' | 'experts';

interface Tab {
  id: TabType;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  count?: number;
}

const SidebarApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('features');
  
  // Get real counts from stores
  const features = useFeatureStore(state => state.features);
  const testCases = useTestCaseStore(state => state.testCases);
  const documents = useDocumentStore(state => state.documents);

  const tabs: Tab[] = [
    {
      id: 'features',
      name: 'Todos',
      icon: <List className="w-4 h-4" />,
      component: FeatureList,
      count: features.length > 0 ? features.length : undefined,
    },
    {
      id: 'tests',
      name: 'Tests',
      icon: <TestTube className="w-4 h-4" />,
      component: TestCases,
      count: testCases.length > 0 ? testCases.length : undefined,
    },
    {
      id: 'docs',
      name: 'Docs',
      icon: <FileText className="w-4 h-4" />,
      component: DocumentGeneration,
      count: documents.length > 0 ? documents.length : undefined,
    },
    {
      id: 'experts',
      name: 'Experts',
      icon: <Users className="w-4 h-4" />,
      component: ExpertHub,
      count: undefined,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || FeatureList;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Content Area - takes remaining space */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ActiveComponent />
      </div>

      {/* Bottom Tab Navigation - sticky footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-1 py-1">
        <div className="flex justify-between">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-1.5 px-2 rounded-md transition-colors relative min-w-0 flex-1 mx-0.5 ${
                activeTab === tab.id
                  ? 'text-black bg-gray-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium mt-0.5 truncate">{tab.name}</span>
              {tab.count && (
                <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {tab.count}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarApp; 