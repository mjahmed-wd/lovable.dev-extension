import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle, XCircle, Clock, Trash2, Edit3, Sparkles, Loader2, ChevronDown, ChevronRight, Filter, Search, ArrowUp, ArrowDown, Pause, Play, StopCircle, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTestCaseStore, type TestResult, type Priority, type TestStep, type TestCase } from '../stores/testCaseStore';
import { apiClient, type TestCaseGenerated } from '../services/api';
import IframeContentReader from '../utils/iframeContentReader';
import moment from 'moment';

// Helper for unique tags
const getAllTags = (testCases: TestCase[]): string[] => {
  const tagSet = new Set<string>();
  testCases.forEach((tc) => tc.tags && tc.tags.forEach((tag: string) => tagSet.add(tag)));
  return Array.from(tagSet);
};

// Session state types
interface TestSession {
  id: string;
  name?: string;
  status: 'active' | 'paused' | 'finished' | 'terminated';
  startedAt: string;
  finishedAt?: string;
}

const TestCases: React.FC = () => {
  // Store hooks
  const {
    testCases,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    updateTestResult,
  } = useTestCaseStore();

  // UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter/search/sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState<TestResult | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'priority' | 'result' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [{ id: uuidv4(), description: 'Step 1...' }, { id: uuidv4(), description: 'Step 2...' }],
    expectedResult: '',
    priority: 'medium' as Priority,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  // Test session state
  const [session, setSession] = useState<TestSession | null>(null);
  const [showSessionNameInput, setShowSessionNameInput] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionHistory, setSessionHistory] = useState<{ [testCaseId: string]: { sessionId: string | null, result: TestResult, executedAt: string }[] }>({});

  // Filtering, searching, and sorting logic
  const filteredAndSortedTestCases = useMemo(() => {
    let filtered = testCases.filter(tc => {
      const matchesResult = filterResult === 'all' || tc.result === filterResult;
      const matchesPriority = filterPriority === 'all' || tc.priority === filterPriority;
      const matchesTag = filterTag === 'all' || (tc.tags && tc.tags.includes(filterTag));
      const matchesSearch =
        tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesResult && matchesPriority && matchesTag && matchesSearch;
    });
    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return sortDir === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      } else if (sortBy === 'priority') {
        const order = { high: 3, medium: 2, low: 1 };
        return sortDir === 'asc' ? order[a.priority] - order[b.priority] : order[b.priority] - order[a.priority];
      } else if (sortBy === 'result') {
        const order = { pass: 3, fail: 2, pending: 1 };
        return sortDir === 'asc' ? order[a.result] - order[b.result] : order[b.result] - order[a.result];
      } else if (sortBy === 'createdAt') {
        return sortDir === 'asc' ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
    return filtered;
  }, [testCases, filterResult, filterPriority, filterTag, searchTerm, sortBy, sortDir]);

  const handleAddTestCase = () => {
    if (!formData.title.trim()) return;

    if (editingCase) {
      updateTestCase(editingCase, {
        title: formData.title,
        description: formData.description,
        steps: formData.steps.filter(step => step.description.trim() && step.description !== 'Step 1...' && step.description !== 'Step 2...'),
        expectedResult: formData.expectedResult,
        priority: formData.priority,
        tags: formData.tags,
      });
      setEditingCase(null);
    } else {
      addTestCase({
        title: formData.title,
        description: formData.description,
        steps: formData.steps.filter(step => step.description.trim() && step.description !== 'Step 1...' && step.description !== 'Step 2...'),
        expectedResult: formData.expectedResult,
        priority: formData.priority,
        tags: formData.tags,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      steps: [{ id: uuidv4(), description: 'Step 1...' }, { id: uuidv4(), description: 'Step 2...' }],
      expectedResult: '',
      priority: 'medium',
      tags: [],
    });
    setShowAddForm(false);
    setEditingCase(null);
  };

  const handleAIGeneration = async () => {
    if (isGeneratingAI) return;

    setIsGeneratingAI(true);
    
    try {
      // Get HTML content from the Lovable iframe
      const htmlContent = await IframeContentReader.getIframeHTML();
      const iframeInfo = IframeContentReader.getIframeInfo();
      const projectContext = iframeInfo ? `Lovable project ${iframeInfo.projectId}` : undefined;

      // Generate test cases using AI
      const generatedTestCases = await apiClient.generateAITestCases(htmlContent, projectContext);

      // Convert AI-generated test cases to our format and add them
      generatedTestCases.forEach((aiTestCase: TestCaseGenerated) => {
        const testSteps: TestStep[] = aiTestCase.steps.map(step => ({
          id: uuidv4(),
          description: step.description
        }));

        addTestCase({
          title: aiTestCase.title,
          description: aiTestCase.description,
          steps: testSteps,
          expectedResult: aiTestCase.expectedResult,
          priority: aiTestCase.priority,
          tags: [],
        });
      });

      console.log(`Successfully generated ${generatedTestCases.length} test cases`);
    } catch (error) {
      console.error('Error generating AI test cases:', error);
      
      // Provide user-friendly error messages
      let errorTitle = 'AI Generation Failed';
      let errorDescription = 'Failed to generate test cases';
      let errorSteps = [
        { id: uuidv4(), description: 'Check console for error details' },
        { id: uuidv4(), description: 'Try again or create test cases manually' }
      ];
      
      if (error instanceof Error) {
        if (error.message.includes('overloaded') || error.message.includes('temporarily')) {
          errorTitle = 'AI Service Temporarily Unavailable';
          errorDescription = 'The AI service is currently overloaded. This is usually temporary.';
          errorSteps = [
            { id: uuidv4(), description: 'Wait 30-60 seconds and try again' },
            { id: uuidv4(), description: 'If problem persists, try again later' }
          ];
        } else if (error.message.includes('rate limit')) {
          errorTitle = 'Rate Limit Exceeded';
          errorDescription = 'Too many requests made recently. Please wait before trying again.';
          errorSteps = [
            { id: uuidv4(), description: 'Wait a few minutes before retrying' },
            { id: uuidv4(), description: 'Consider generating fewer test cases at once' }
          ];
        } else {
          errorDescription = error.message;
        }
      }
      
      // Add a fallback test case to show the error
      addTestCase({
        title: errorTitle,
        description: errorDescription,
        steps: errorSteps,
        expectedResult: 'Manual intervention required',
        priority: 'high',
        tags: [],
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const startEditTestCase = (testCaseId: string) => {
    const testCase = testCases.find(tc => tc.id === testCaseId);
    if (!testCase) return;
    
    setEditingCase(testCaseId);
    setFormData({
      title: testCase.title,
      description: testCase.description,
      steps: testCase.steps.length > 0 ? testCase.steps : [{ id: uuidv4(), description: 'Step 1...' }],
      expectedResult: testCase.expectedResult,
      priority: testCase.priority,
      tags: testCase.tags || [],
    });
    setShowAddForm(true);
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { id: uuidv4(), description: `Step ${formData.steps.length + 1}...` }],
    });
  };

  const updateStep = (stepId: string, description: string) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(step =>
        step.id === stepId ? { ...step, description } : step
      ),
    });
  };

  const removeStep = (stepId: string) => {
    if (formData.steps.length > 1) {
      setFormData({
        ...formData,
        steps: formData.steps.filter(step => step.id !== stepId),
      });
    }
  };

  // Tag add handler
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (("key" in e && e.key === 'Enter') || ("type" in e && e.type === 'click')) {
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData({ ...formData, tags: [...formData.tags, tag] });
      }
      setTagInput('');
    }
  };
  // Tag remove handler
  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Accordion toggle handler
  const handleAccordionToggle = (testCaseId: string) => {
    setExpandedCase(expandedCase === testCaseId ? null : testCaseId);
  };

  // Session handlers
  const handleStartSession = () => {
    if (session && (session.status === 'active' || session.status === 'paused')) return;
    const newSession: TestSession = {
      id: uuidv4(),
      status: 'active',
      startedAt: new Date().toISOString(),
    };
    setSession(newSession);
  };

  const handlePauseSession = () => {
    if (session && session.status === 'active') {
      setSession({ ...session, status: 'paused' });
    }
  };

  const handleResumeSession = () => {
    if (session && session.status === 'paused') {
      setSession({ ...session, status: 'active' });
    }
  };

  const handleTerminateSession = () => {
    if (session) {
      setSession({ ...session, status: 'terminated', finishedAt: new Date().toISOString() });
    }
  };

  const handleFinishSession = () => {
    setShowSessionNameInput(true);
  };

  const handleSaveSessionName = () => {
    if (session) {
      setSession({ ...session, status: 'finished', name: sessionName, finishedAt: new Date().toISOString() });
      setShowSessionNameInput(false);
      setSessionName('');
    }
  };

  // Patch updateTestResult to store session info in sessionHistory
  const updateTestResultWithSession = (testCaseId: string, result: TestResult) => {
    updateTestResult(testCaseId, result);
    setSessionHistory(prev => {
      const prevHistory = prev[testCaseId] || [];
      return {
        ...prev,
        [testCaseId]: [
          ...prevHistory,
          {
            sessionId: session && (session.status === 'active' || session.status === 'paused') ? session.id : null,
            result,
            executedAt: new Date().toISOString(),
          },
        ],
      };
    });
  };

  const resultIcons = {
    pass: <CheckCircle className="w-4 h-4 text-green-600" />,
    fail: <XCircle className="w-4 h-4 text-red-600" />,
    pending: <Clock className="w-4 h-4 text-gray-400" />,
  };

  const resultColors = {
    pass: 'bg-green-100 text-green-800',
    fail: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  // All tags for filter dropdown
  const allTags: string[] = useMemo(() => getAllTags(testCases), [testCases]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header: Title and AI/New Test Buttons */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Test Cases</h1>
          <div className="flex gap-2">
            <button 
              onClick={handleAIGeneration}
              disabled={isGeneratingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {isGeneratingAI ? 'Generating...' : 'AI Generate'}
            </button>
            <button 
              onClick={() => {
                setEditingCase(null);
                setFormData({
                  title: '',
                  description: '',
                  steps: [{ id: uuidv4(), description: 'Step 1...' }, { id: uuidv4(), description: 'Step 2...' }],
                  expectedResult: '',
                  priority: 'medium',
                  tags: [],
                });
                setShowAddForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
            >
              <Plus className="w-3 h-3" />
              New Test
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar (now below header) */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search tests..."
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>
          <button
            className={`p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 ${filterOpen ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setFilterOpen(f => !f)}
            aria-label="Show filters"
          >
            <Filter className="w-5 h-5" />
          </button>
          {/* Add session start button */}
          <button
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
            onClick={handleStartSession}
            aria-label="Start test session"
            disabled={!!(session && (session.status === 'active' || session.status === 'paused'))}
          >
            <Plus className="w-5 h-5 text-green-600" />
          </button>
        </div>
        {filterOpen && (
          <div className="flex flex-wrap gap-2 mt-2 animate-fade-in">
            <select
              value={filterResult}
              onChange={e => setFilterResult(e.target.value as TestResult | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[120px]"
            >
              <option value="all">All Results</option>
              <option value="pass">Passed</option>
              <option value="fail">Failed</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[120px]"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value as string | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[120px]"
            >
              <option value="all">All Tags</option>
              {allTags.map((tag: string) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              >
                <option value="createdAt">Created</option>
                <option value="title">Title</option>
                <option value="priority">Priority</option>
                <option value="result">Result</option>
              </select>
              <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="p-1 text-gray-400 hover:text-gray-700">
                {sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}
        {/* Session Controls moved below search/filter */}
        {(session && (session.status === 'active' || session.status === 'paused')) && (
          <div className="flex gap-2 items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 mt-2">
            <span className="text-xs font-medium text-gray-700">Session: {session.name || 'Untitled'}</span>
            {session.status === 'active' ? (
              <button onClick={handlePauseSession} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Pause Session"><Pause className="w-4 h-4" /></button>
            ) : (
              <button onClick={handleResumeSession} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Resume Session"><Play className="w-4 h-4" /></button>
            )}
            <button onClick={handleFinishSession} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Finish Session"><Save className="w-4 h-4" /></button>
            <button onClick={handleTerminateSession} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Terminate Session"><StopCircle className="w-4 h-4" /></button>
          </div>
        )}
        {showSessionNameInput && (
          <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-lg px-2 py-1 mt-2">
            <input
              type="text"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Session name..."
              className="px-2 py-1 text-sm border border-gray-200 rounded"
            />
            <button onClick={() => { handleSaveSessionName(); setShowSessionNameInput(false); }} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white border-b border-gray-100 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {editingCase ? 'Edit Test Case' : 'Add New Test Case'}
            </h3>
            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 text-sm"
                  placeholder="Test case title..."
                />
              </div>
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-1">
                  {formData.tags.map((tag: string) => (
                    <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                      {tag}
                      <button type="button" className="ml-1 text-blue-400 hover:text-red-500" onClick={() => handleRemoveTag(tag)}>
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag and press Enter"
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded text-sm"
                  />
                  <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Add</button>
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 resize-none text-sm"
                  rows={2}
                  placeholder="Test description..."
                />
              </div>

              {/* Test Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Test Steps</label>
                  <button
                    onClick={addStep}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-3 h-3" />
                    Add Step
                  </button>
                </div>
                
                {/* Steps List */}
                <div className="space-y-2">
                  {formData.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
                      <span className="text-xs text-gray-500 font-medium w-6">{index + 1}.</span>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-sm"
                        placeholder={`Step ${index + 1}...`}
                      />
                      {formData.steps.length > 1 && (
                        <button
                          onClick={() => removeStep(step.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
                <textarea
                  value={formData.expectedResult}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 resize-none text-sm"
                  rows={2}
                  placeholder="Expected result..."
                />
              </div>

              {/* Priority Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-32 px-3 py-2 bg-gray-100 border-0 rounded-lg text-gray-900 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddTestCase}
                  disabled={!formData.title.trim()}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  {editingCase ? 'Update Test Case' : 'Add Test Case'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accordion List of Test Cases */}
        <div className="p-4">
          {filteredAndSortedTestCases.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or create a new test case</p>
              <button 
                onClick={() => {
                  setEditingCase(null);
                  setFormData({
                    title: '',
                    description: '',
                    steps: [{ id: uuidv4(), description: 'Step 1...' }, { id: uuidv4(), description: 'Step 2...' }],
                    expectedResult: '',
                    priority: 'medium',
                    tags: [],
                  });
                  setShowAddForm(true);
                }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
              >
                Create Test Case
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedTestCases.map((testCase, idx) => {
                const isExpanded = expandedCase === testCase.id;
                // Get session-aware history for this test case
                const caseHistory = sessionHistory[testCase.id] || testCase.history || [];
                // Handler for result button click
                const handleResultClick = (result: TestResult) => {
                  updateTestResultWithSession(testCase.id, result);
                  // Close the accordion
                  setExpandedCase(null);
                  // If session is active, open the next test accordion
                  if (session && session.status === 'active') {
                    // Find the next test case in the filtered list
                    const nextIdx = filteredAndSortedTestCases.findIndex(tc => tc.id === testCase.id) + 1;
                    if (nextIdx < filteredAndSortedTestCases.length) {
                      setTimeout(() => setExpandedCase(filteredAndSortedTestCases[nextIdx].id), 200); // slight delay for UX
                    }
                  }
                };
                return (
                  <div key={testCase.id} className="bg-white rounded-lg border border-gray-200">
                    {/* Accordion Header */}
                    <button
                      className="w-full flex flex-col px-4 py-3 focus:outline-none hover:bg-gray-50 rounded-t-lg text-left"
                      onClick={() => handleAccordionToggle(testCase.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span className="font-medium text-gray-900 text-sm">{testCase.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Status Icon */}
                          {resultIcons[testCase.result]}
                          {/* Priority */}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[testCase.priority]}`}>{testCase.priority.charAt(0).toUpperCase() + testCase.priority.slice(1)}</span>
                        </div>
                      </div>
                      {/* Tags Row */}
                      {testCase.tags && testCase.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {testCase.tags.map((tag: string) => (
                            <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{tag}</span>
                          ))}
                        </div>
                      )}
                      {/* Edit/Delete Row */}
                      <div className="flex gap-1 mt-2 justify-end">
                        <button
                          onClick={e => { e.stopPropagation(); startEditTestCase(testCase.id); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteTestCase(testCase.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </button>
                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="px-6 pb-4 pt-2">
                        {testCase.description && (
                          <p className="text-sm text-gray-600 mb-2">{testCase.description}</p>
                        )}
                        {/* Test Steps */}
                        {testCase.steps.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Steps</h4>
                            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-0.5">
                              {testCase.steps.map((step, index) => (
                                <li key={step.id} className="text-xs">{step.description}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {/* Expected Result */}
                        {testCase.expectedResult && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Expected Result</h4>
                            <p className="text-xs text-gray-700">{testCase.expectedResult}</p>
                          </div>
                        )}
                        {/* Pass/Fail/Reset Buttons */}
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => handleResultClick('pass')}
                            className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleResultClick('fail')}
                            className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleResultClick('pending')}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          >
                            <Clock className="w-3 h-3" />
                          </button>
                        </div>
                        {/* History Section */}
                        {caseHistory.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Result History</h4>
                            <ul className="text-xs text-gray-700 space-y-1">
                              {caseHistory.slice().reverse().map((entry, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  {resultIcons[entry.result]}
                                  <span className="text-gray-400">{moment(entry.executedAt).format('hh:mm A, DD MMMM, YYYY')}</span>
                                  {entry.sessionId ? (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xxs">{(session && session.id === entry.sessionId && session.name) || 'Session'}</span>
                                  ) : (
                                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xxs">Independent</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCases; 