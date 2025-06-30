import React, { useState, useMemo } from 'react';
import { Plus, Clock, CheckCircle, AlertTriangle, Trash2, Edit3, ChevronDown, StickyNote } from 'lucide-react';
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

  // Form state - defaults to 'pending' status and 'medium' priority
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
  });

  const priorityColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
    urgent: 'text-red-600',
  };

  const statusConfig = {
    pending: { 
      icon: <Clock className="w-4 h-4" />, 
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      label: 'Pending'
    },
    'in-progress': { 
      icon: <AlertTriangle className="w-4 h-4" />, 
      color: 'text-blue-600',
      bg: 'bg-blue-100', 
      label: 'In Progress'
    },
    done: { 
      icon: <CheckCircle className="w-4 h-4" />, 
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: 'Done'
    },
  };

  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

  const filteredAndSortedFeatures = useMemo(() => {
    let filtered = features.filter((feature) => {
      const statusMatch = filterStatus === 'all' || feature.status === filterStatus;
      const priorityMatch = filterPriority === 'all' || feature.priority === filterPriority;
      return statusMatch && priorityMatch;
    });

    return filtered.sort((a, b) => {
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
    urgent: features.filter(f => f.priority === 'urgent').length,
  };

  const handleAddFeature = () => {
    if (!formData.title.trim()) return;

    if (editingFeature) {
      // Update existing feature
      updateFeature(editingFeature, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });
      setEditingFeature(null);
    } else {
      // Add new feature - ALWAYS starts as 'pending'
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Todo Manager</h1>
          <button className="text-gray-400 hover:text-gray-600">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex gap-3 mb-4">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">{stats.pending} Pending</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-full">
            <AlertTriangle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">{stats.inProgress} In Progress</span>
          </div>
          <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-full">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">{stats.done} Done</span>
          </div>
        </div>

        {/* Add Todo Button */}
        <button
          onClick={() => {
            setEditingFeature(null);
            setFormData({ title: '', description: '', priority: 'medium' });
            setShowAddForm(true);
          }}
          className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg py-4 px-4 flex items-center justify-center text-gray-600 hover:text-gray-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Todo
        </button>
      </div>

      {/* Filter Pills */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        {/* Status Filters */}
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Status</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All {stats.total}
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'pending' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pending {stats.pending}
            </button>
            <button
              onClick={() => setFilterStatus('in-progress')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'in-progress' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              In Progress {stats.inProgress}
            </button>
            <button
              onClick={() => setFilterStatus('done')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterStatus === 'done' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              Completed {stats.done}
            </button>
          </div>
        </div>

        {/* Priority Filters */}
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Priority</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterPriority('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterPriority === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Priorities
            </button>
            <button
              onClick={() => setFilterPriority('urgent')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterPriority === 'urgent' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              Urgent {stats.urgent}
            </button>
            <button
              onClick={() => setFilterPriority('high')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterPriority === 'high' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-red-50 text-red-500 hover:bg-red-100'
              }`}
            >
              High {stats.high}
            </button>
            <button
              onClick={() => setFilterPriority('medium')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterPriority === 'medium' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              }`}
            >
              Medium {stats.medium}
            </button>
            <button
              onClick={() => setFilterPriority('low')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filterPriority === 'low' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              Low {stats.low}
            </button>
          </div>
        </div>
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h2>
        
        {filteredAndSortedFeatures.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedFeatures.map((feature) => (
              <div key={feature.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{feature.title}</h3>
                      {feature.description && (
                        <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[feature.status].bg} ${statusConfig[feature.status].color}`}>
                          {statusConfig[feature.status].label}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium bg-yellow-100 ${priorityColors[feature.priority]}`}>
                          {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateFeatureStatus(feature.id, 'in-progress')}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm font-medium hover:bg-blue-200"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Start
                        </button>
                        <button
                          onClick={() => updateFeatureStatus(feature.id, 'done')}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded text-sm font-medium hover:bg-green-200"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Complete
                        </button>
                      </div>

                      {/* Notes Toggle */}
                      {feature.notes.length > 0 && (
                        <button
                          onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                          className="flex items-center gap-1 mt-2 text-gray-500 hover:text-gray-700"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedFeature === feature.id ? 'rotate-180' : ''}`} />
                          <StickyNote className="w-4 h-4" />
                          Notes
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEditFeature(feature.id)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteFeature(feature.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes Section */}
                {expandedFeature === feature.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      {feature.notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded text-sm flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-gray-700">{note.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => removeNote(feature.id, note.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-red-600"
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
                        className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
                      />
                      <button
                        onClick={() => addNote(feature.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
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

      {/* Add/Edit Todo Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingFeature ? 'Edit Todo' : 'Add New Todo'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter todo title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Enter description"
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
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelEdit}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeature}
                disabled={!formData.title.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {editingFeature ? 'Update Todo' : 'Add Todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureList; 