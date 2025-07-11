import React, { useState } from 'react';
import { List, TestTube, FileText, Users, MessageCircle, LogOut, User } from 'lucide-react';

import FeatureList from './FeatureList';
import TestCases from './TestCases';
import DocumentGeneration from './DocumentGeneration';
import ExpertHub from './ExpertHub';
import { ConversationViewer } from './ConversationViewer';
import Login from './Login';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useFeatureStore } from '../stores/featureStore';
import { useTestCaseStore } from '../stores/testCaseStore';
import { useDocumentStore } from '../stores/documentStore';

type TabType = 'conversation' | 'features' | 'tests' | 'docs' | 'experts';

interface Tab {
  id: TabType;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  count?: number;
}

const AuthenticatedApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('conversation');
  const { user, logout, loading } = useAuth();
  
  // Get real counts from stores
  const features = useFeatureStore(state => state.features);
  const testCases = useTestCaseStore(state => state.testCases);
  const documents = useDocumentStore(state => state.documents);

  const tabs: Tab[] = [
    {
      id: 'conversation',
      name: 'Chat',
      icon: <MessageCircle className="w-4 h-4" />,
      component: ConversationViewer,
      count: undefined,
    },
    {
      id: 'features',
      name: 'Tasks',
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

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ConversationViewer;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with user info and logout */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

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

const SidebarApp: React.FC = () => {
  return (
    <AuthProvider>
      <AuthGuard>
        <AuthenticatedApp />
      </AuthGuard>
    </AuthProvider>
  );
};

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
};

export default SidebarApp; 