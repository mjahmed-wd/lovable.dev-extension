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
      icon: <List className="w-5 h-5" />,
      component: FeatureList,
      count: features.length > 0 ? features.length : undefined,
    },
    {
      id: 'tests',
      name: 'Tests',
      icon: <TestTube className="w-5 h-5" />,
      component: TestCases,
      count: testCases.length > 0 ? testCases.length : undefined,
    },
    {
      id: 'docs',
      name: 'Docs',
      icon: <FileText className="w-5 h-5" />,
      component: DocumentGeneration,
      count: documents.length > 0 ? documents.length : undefined,
    },
    {
      id: 'experts',
      name: 'Experts',
      icon: <Users className="w-5 h-5" />,
      component: ExpertHub,
      count: undefined, // No store for experts yet
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || FeatureList;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ActiveComponent />
      </div>

      {/* Bottom Tab Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-between">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 relative ${
                activeTab === tab.id
                  ? 'text-black'
                  : 'text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium mt-1">{tab.name}</span>
              {tab.count && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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