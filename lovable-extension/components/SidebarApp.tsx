import React, { useState } from 'react';
import { List, TestTube, FileText, Users, Sparkles } from 'lucide-react';

import FeatureList from './FeatureList';
import TestCases from './TestCases';
import DocumentGeneration from './DocumentGeneration';
import ExpertHub from './ExpertHub';

type TabType = 'features' | 'tests' | 'docs' | 'experts';

interface Tab {
  id: TabType;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  color: string;
  bgGradient: string;
}

const SidebarApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('features');

  const tabs: Tab[] = [
    {
      id: 'features',
      name: 'Features',
      icon: <List className="w-4 h-4" />,
      component: FeatureList,
      color: 'text-blue-600',
      bgGradient: 'from-blue-500 to-blue-600',
    },
    {
      id: 'tests',
      name: 'Tests',
      icon: <TestTube className="w-4 h-4" />,
      component: TestCases,
      color: 'text-green-600',
      bgGradient: 'from-green-500 to-green-600',
    },
    {
      id: 'docs',
      name: 'Docs',
      icon: <FileText className="w-4 h-4" />,
      component: DocumentGeneration,
      color: 'text-purple-600',
      bgGradient: 'from-purple-500 to-purple-600',
    },
    {
      id: 'experts',
      name: 'Experts',
      icon: <Users className="w-4 h-4" />,
      component: ExpertHub,
      color: 'text-orange-600',
      bgGradient: 'from-orange-500 to-orange-600',
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || FeatureList;
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Lovable</h1>
              <p className="text-xs text-white text-opacity-80">Development Assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-2 py-3">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-xl font-medium text-xs transition-all duration-200 transform hover:scale-105
                ${activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.bgGradient} text-white shadow-lg shadow-${tab.id === 'features' ? 'blue' : tab.id === 'tests' ? 'green' : tab.id === 'docs' ? 'purple' : 'orange'}-200`
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }
              `}
            >
              <div className={`mb-1 ${activeTab === tab.id ? 'transform scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className="font-semibold">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Tab Indicator */}
      {activeTabData && (
        <div className={`px-4 py-2 bg-gradient-to-r ${activeTabData.bgGradient} text-white`}>
          <div className="flex items-center gap-2">
            {activeTabData.icon}
            <span className="font-semibold text-sm">{activeTabData.name} Dashboard</span>
          </div>
        </div>
      )}

      {/* Tab Content with enhanced styling */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <div className="h-full">
          <ActiveComponent />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>© 2024 Lovable</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarApp; 