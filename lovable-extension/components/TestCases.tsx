import React, { useState } from 'react';
import { Plus, CheckCircle, XCircle, Clock, Trash2, Edit } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type TestResult = 'pass' | 'fail' | 'pending';
type Priority = 'low' | 'medium' | 'high';

interface TestStep {
  id: string;
  description: string;
}

interface TestCase {
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

const TestCases: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCase, setEditingCase] = useState<TestCase | null>(null);
  const [filterResult, setFilterResult] = useState<TestResult | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [{ id: uuidv4(), description: '' }, { id: uuidv4(), description: '' }],
    expectedResult: '',
    priority: 'medium' as Priority,
  });

  const resultIcons = {
    pass: <CheckCircle className="w-4 h-4 text-green-500" />,
    fail: <XCircle className="w-4 h-4 text-red-500" />,
    pending: <Clock className="w-4 h-4 text-gray-400" />,
  };

  const resultColors = {
    pass: 'bg-green-100 text-green-800 border-green-200',
    fail: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const filteredTestCases = testCases.filter((testCase) => {
    const resultMatch = filterResult === 'all' || testCase.result === filterResult;
    const priorityMatch = filterPriority === 'all' || testCase.priority === filterPriority;
    return resultMatch && priorityMatch;
  });

  const stats = {
    total: testCases.length,
    passed: testCases.filter(tc => tc.result === 'pass').length,
    failed: testCases.filter(tc => tc.result === 'fail').length,
    pending: testCases.filter(tc => tc.result === 'pending').length,
  };

  const handleAddTestCase = () => {
    if (!formData.title.trim()) return;

    const newTestCase: TestCase = {
      id: uuidv4(),
      title: formData.title,
      description: formData.description,
      steps: formData.steps.filter(step => step.description.trim()),
      expectedResult: formData.expectedResult,
      priority: formData.priority,
      result: 'pending',
      createdAt: new Date(),
    };

    setTestCases([...testCases, newTestCase]);
    resetForm();
  };

  const handleUpdateTestCase = () => {
    if (!editingCase || !formData.title.trim()) return;

    setTestCases(testCases.map(tc =>
      tc.id === editingCase.id
        ? {
            ...tc,
            title: formData.title,
            description: formData.description,
            steps: formData.steps.filter(step => step.description.trim()),
            expectedResult: formData.expectedResult,
            priority: formData.priority,
          }
        : tc
    ));

    setEditingCase(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      steps: [{ id: uuidv4(), description: '' }, { id: uuidv4(), description: '' }],
      expectedResult: '',
      priority: 'medium',
    });
    setShowAddForm(false);
    setEditingCase(null);
  };

  const updateTestResult = (testCaseId: string, result: TestResult, notes?: string) => {
    setTestCases(testCases.map(tc =>
      tc.id === testCaseId
        ? {
            ...tc,
            result,
            executedAt: new Date(),
            notes: notes || tc.notes,
          }
        : tc
    ));
  };

  const deleteTestCase = (testCaseId: string) => {
    setTestCases(testCases.filter(tc => tc.id !== testCaseId));
  };

  const startEditTestCase = (testCase: TestCase) => {
    setEditingCase(testCase);
    setFormData({
      title: testCase.title,
      description: testCase.description,
      steps: testCase.steps.length > 0 ? testCase.steps : [{ id: uuidv4(), description: '' }],
      expectedResult: testCase.expectedResult,
      priority: testCase.priority,
    });
    setShowAddForm(true);
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { id: uuidv4(), description: '' }],
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

  return (
    <div className="h-full flex flex-col">
      {/* Header with stats and controls */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Test Cases</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Test Case
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            <div className="text-sm text-gray-500">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value as TestResult | 'all')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Results</option>
            <option value="pending">Pending</option>
            <option value="pass">Passed</option>
            <option value="fail">Failed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTestCases.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No test cases found. Add your first test case to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTestCases.map((testCase) => (
              <div key={testCase.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{testCase.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[testCase.priority]}`}>
                          {testCase.priority}
                        </span>
                        <div className={`px-2 py-1 rounded border text-xs font-medium ${resultColors[testCase.result]}`}>
                          <div className="flex items-center gap-1">
                            {resultIcons[testCase.result]}
                            {testCase.result.charAt(0).toUpperCase() + testCase.result.slice(1)}
                          </div>
                        </div>
                      </div>
                      {testCase.description && (
                        <p className="text-gray-600 text-sm mb-3">{testCase.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditTestCase(testCase)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deleteTestCase(testCase.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Test Steps */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Test Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {testCase.steps.map((step, index) => (
                        <li key={step.id} className="text-sm text-gray-700">
                          {step.description}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Expected Result */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Expected Result:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{testCase.expectedResult}</p>
                  </div>

                  {/* Test Execution Controls */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => updateTestResult(testCase.id, 'pass')}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Pass
                    </button>
                    <button
                      onClick={() => updateTestResult(testCase.id, 'fail')}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" />
                      Fail
                    </button>
                    <button
                      onClick={() => updateTestResult(testCase.id, 'pending')}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      Reset
                    </button>
                  </div>

                  {/* Execution Info */}
                  {testCase.executedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Last executed: {testCase.executedAt.toLocaleDateString()} {testCase.executedAt.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Test Case Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingCase ? 'Edit Test Case' : 'Add New Test Case'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Case Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Test case title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Test description..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Test Steps:</label>
                  <button
                    onClick={addStep}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Step
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.steps.map((step, index) => (
                    <div key={step.id} className="flex gap-2">
                      <span className="text-sm text-gray-500 mt-2 min-w-[20px]">{index + 1}.</span>
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder={`Step ${index + 1}...`}
                      />
                      {formData.steps.length > 1 && (
                        <button
                          onClick={() => removeStep(step.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Result *</label>
                <textarea
                  value={formData.expectedResult}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Expected result..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={editingCase ? handleUpdateTestCase : handleAddTestCase}
                disabled={!formData.title.trim() || !formData.expectedResult.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {editingCase ? 'Update Test Case' : 'Add Test Case'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCases; 