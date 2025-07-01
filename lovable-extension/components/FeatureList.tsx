import React, { useState, useMemo } from 'react';
import { Plus, Clock, CheckCircle, AlertTriangle, Trash2, Edit3, Play, ChevronDown, StickyNote } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useFeatureStore, type Priority, type Status } from '../stores/featureStore';

const FeatureList: React.FC = () => {
  const {
    features,
    addFeature,
    updateFeature,
    deleteFeature,
    updateFeatureStatus,
    addNoteToFeature,
    removeNoteFromFeature,
  } = useFeatureStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<{ [key: string]: string }>({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
  });

  const filteredAndSortedFeatures = useMemo(() => {
    let filtered = features.filter((feature) => {
      const statusMatch = filterStatus === 'all' || feature.status === filterStatus;
      const priorityMatch = filterPriority === 'all' || feature.priority === filterPriority;
      return statusMatch && priorityMatch;
    });

    return filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [features, filterStatus, filterPriority]);

  const stats = {
    total: features.length,
    pending: features.filter(f => f.status === 'pending').length,
    inProgress: features.filter(f => f.status === 'in-progress').length,
    done: features.filter(f => f.status === 'done').length,
    high: features.filter(f => f.priority === 'high').length,
    medium: features.filter(f => f.priority === 'medium').length,
    low: features.filter(f => f.priority === 'low').length,
  };

  const handleAddFeature = () => {
    if (!formData.title.trim()) return;

    if (editingFeature) {
      updateFeature(editingFeature, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });
      setEditingFeature(null);
    } else {
      addFeature({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        notes: [],
      });
    }

    setFormData({ title: '', description: '', priority: 'medium' });
    setShowAddForm(false);
  };

  const startEditFeature = (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;
    
    setEditingFeature(featureId);
    setFormData({
      title: feature.title,
      description: feature.description,
      priority: feature.priority,
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingFeature(null);
    setFormData({ title: '', description: '', priority: 'medium' });
    setShowAddForm(false);
  };

  const addNote = (featureId: string) => {
    const noteContent = newNote[featureId]?.trim();
    if (!noteContent) return;

    addNoteToFeature(featureId, noteContent);
    setNewNote({ ...newNote, [featureId]: '' });
  };

  const removeNote = (featureId: string, noteId: string) => {
    removeNoteFromFeature(featureId, noteId);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900">Todo Manager</h1>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Status Overview */}
      <div className="flex gap-4 p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-3 h-3" />
          <span className="text-sm font-medium">{stats.pending} Pending</span>
        </div>
        <div className="flex items-center gap-2 text-blue-600">
          <Play className="w-3 h-3" />
          <span className="text-sm font-medium">{stats.inProgress} In Progress</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <CheckCircle className="w-3 h-3" />
          <span className="text-sm font-medium">{stats.done} Done</span>
        </div>
      </div>

      {/* Add New Todo Button */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={() => {
            setEditingFeature(null);
            setFormData({ title: '', description: '', priority: 'medium' });
            setShowAddForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Todo
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 border-b border-gray-100">
        {/* Status Filters */}
        <div className="flex gap-1.5 mb-3">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === 'all' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{features.length}</span>
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === 'pending' 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{stats.pending}</span>
          </button>
          <button
            onClick={() => setFilterStatus('in-progress')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === 'in-progress' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            In Progress <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{stats.inProgress}</span>
          </button>
          <button
            onClick={() => setFilterStatus('done')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === 'done' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-green-600 hover:bg-green-200'
            }`}
          >
            Completed <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{stats.done}</span>
          </button>
        </div>

        {/* Priority Filters */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilterPriority('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterPriority === 'all' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Priorities
          </button>
          <button
            onClick={() => setFilterPriority('high')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterPriority === 'high' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-red-600 hover:bg-red-200'
            }`}
          >
            High Priority <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{stats.high}</span>
          </button>
          <button
            onClick={() => setFilterPriority('medium')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterPriority === 'medium' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-yellow-600 hover:bg-yellow-200'
            }`}
          >
            Medium <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{stats.medium}</span>
          </button>
          <button
            onClick={() => setFilterPriority('low')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterPriority === 'low' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-green-600 hover:bg-green-200'
            }`}
          >
            Low Priority <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{stats.low}</span>
          </button>
        </div>
      </div>

      {/* All Tasks Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h2>
          
          {filteredAndSortedFeatures.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No tasks found</p>
              <p className="text-gray-400 text-sm">Create your first task to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedFeatures.map((feature) => (
                <div key={feature.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        feature.status === 'done' ? 'bg-green-500' : 
                        feature.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{feature.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            feature.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                            feature.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {feature.status === 'pending' ? 'Pending' :
                             feature.status === 'in-progress' ? 'In Progress' : 'Completed'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            feature.priority === 'high' ? 'bg-red-100 text-red-700' :
                            feature.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {feature.status === 'pending' && (
                            <button
                              onClick={() => updateFeatureStatus(feature.id, 'in-progress')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              Start
                            </button>
                          )}
                          {feature.status === 'in-progress' && (
                            <>
                              <button
                                onClick={() => updateFeatureStatus(feature.id, 'pending')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors"
                              >
                                <Clock className="w-3 h-3" />
                                Reset
                              </button>
                              <button
                                onClick={() => updateFeatureStatus(feature.id, 'done')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Complete
                              </button>
                            </>
                          )}
                          {feature.status === 'done' && (
                            <button
                              onClick={() => updateFeatureStatus(feature.id, 'in-progress')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              Reopen
                            </button>
                          )}
                          {feature.status === 'pending' && (
                            <button
                              onClick={() => updateFeatureStatus(feature.id, 'done')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </button>
                          )}
                        </div>

                        {/* Notes Toggle */}
                        {feature.notes.length > 0 && (
                          <button
                            onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                            className="flex items-center gap-1.5 mt-3 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedFeature === feature.id ? 'rotate-180' : ''}`} />
                            <StickyNote className="w-3 h-3" />
                            <span className="text-xs">Notes</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-3">
                      <button 
                        onClick={() => startEditFeature(feature.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => deleteFeature(feature.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Notes Section */}
                  {expandedFeature === feature.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        {feature.notes.map((note) => (
                          <div key={note.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-gray-700 text-sm">{note.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => removeNote(feature.id, note.id)}
                              className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Add a note..."
                          value={newNote[feature.id] || ''}
                          onChange={(e) => setNewNote({ ...newNote, [feature.id]: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && addNote(feature.id)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => addNote(feature.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Todo Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {editingFeature ? 'Edit Todo' : 'Add New Todo'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter todo title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  rows={2}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={cancelEdit}
                className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeature}
                disabled={!formData.title.trim()}
                className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
              >
                {editingFeature ? 'Update' : 'Add Todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureList; 