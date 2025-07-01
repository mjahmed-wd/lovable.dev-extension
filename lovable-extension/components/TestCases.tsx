import React, { useState } from 'react';
import { Plus, CheckCircle, XCircle, Clock, Trash2, Edit3, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTestCaseStore, type TestResult, type Priority, type TestStep } from '../stores/testCaseStore';

const TestCases: React.FC = () => {
  const {
    testCases,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    updateTestResult,
  } = useTestCaseStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCase, setEditingCase] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    steps: [{ id: uuidv4(), description: 'Step 1...' }, { id: uuidv4(), description: 'Step 2...' }],
    expectedResult: '',
    priority: 'medium' as Priority,
  });

  const handleAddTestCase = () => {
    if (!formData.title.trim()) return;

    if (editingCase) {
      updateTestCase(editingCase, {
        title: formData.title,
        description: formData.description,
        steps: formData.steps.filter(step => step.description.trim() && step.description !== 'Step 1...' && step.description !== 'Step 2...'),
        expectedResult: formData.expectedResult,
        priority: formData.priority,
      });
      setEditingCase(null);
    } else {
      addTestCase({
        title: formData.title,
        description: formData.description,
        steps: formData.steps.filter(step => step.description.trim() && step.description !== 'Step 1...' && step.description !== 'Step 2...'),
        expectedResult: formData.expectedResult,
        priority: formData.priority,
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
    });
    setShowAddForm(false);
    setEditingCase(null);
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Test Cases</h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
              <Sparkles className="w-3 h-3" />
              AI Generate
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

        {/* Test Cases List */}
        <div className="p-4">
          {testCases.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases yet</h3>
              <p className="text-gray-500 mb-4">Create your first test case to get started</p>
              <button 
                onClick={() => {
                  setEditingCase(null);
                  setFormData({
                    title: '',
                    description: '',
                    steps: [{ id: uuidv4(), description: 'Step 1...' }, { id: uuidv4(), description: 'Step 2...' }],
                    expectedResult: '',
                    priority: 'medium',
                  });
                  setShowAddForm(true);
                }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm"
              >
                Create Test Case
              </button>
            </div>
          ) :
            <div className="space-y-3">
              {testCases.map((testCase) => (
                <div key={testCase.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">{testCase.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${resultColors[testCase.result]}`}>
                          {testCase.result.charAt(0).toUpperCase() + testCase.result.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[testCase.priority]}`}>
                          {testCase.priority.charAt(0).toUpperCase() + testCase.priority.slice(1)}
                        </span>
                      </div>
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

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateTestResult(testCase.id, 'pass')}
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Pass
                        </button>
                        <button
                          onClick={() => updateTestResult(testCase.id, 'fail')}
                          className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          <XCircle className="w-3 h-3" />
                          Fail
                        </button>
                        <button
                          onClick={() => updateTestResult(testCase.id, 'pending')}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                        >
                          <Clock className="w-3 h-3" />
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-1 ml-3">
                      <button
                        onClick={() => startEditTestCase(testCase.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteTestCase(testCase.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default TestCases; 