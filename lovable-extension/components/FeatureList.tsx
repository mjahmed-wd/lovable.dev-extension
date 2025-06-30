import React, { useState, useMemo } from 'react';
import { Plus, Filter, ChevronDown, CheckCircle, Clock, AlertCircle, StickyNote, X, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'todo' | 'in-progress' | 'completed';

interface Note {
  id: string;
  content: string;
  createdAt: Date;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

const FeatureList: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'date'>('priority');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<{ [key: string]: string }>({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
  });

  const priorityColors = {
    low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusConfig = {
    todo: { 
      icon: <Clock className="w-4 h-4" />, 
      color: 'text-gray-600', 
      bg: 'bg-gray-100',
      label: 'To Do'
    },
    'in-progress': { 
      icon: <AlertCircle className="w-4 h-4" />, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      label: 'In Progress'
    },
    completed: { 
      icon: <CheckCircle className="w-4 h-4" />, 
      color: 'text-green-600', 
      bg: 'bg-green-100',
      label: 'Completed'
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
      switch (sortBy) {
        case 'priority':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
  }, [features, filterStatus, filterPriority, sortBy]);

  const stats = {
    total: features.length,
    completed: features.filter(f => f.status === 'completed').length,
    inProgress: features.filter(f => f.status === 'in-progress').length,
    todo: features.filter(f => f.status === 'todo').length,
  };

  const handleAddFeature = () => {
    if (!formData.title.trim()) return;

    const newFeature: Feature = {
      id: uuidv4(),
      title: formData.title,
      description: formData.description,
      status: 'todo',
      priority: formData.priority,
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setFeatures([...features, newFeature]);
    setFormData({ title: '', description: '', priority: 'medium' });
    setShowAddForm(false);
  };

  const updateFeatureStatus = (featureId: string, status: Status) => {
    setFeatures(features.map(feature =>
      feature.id === featureId
        ? { ...feature, status, updatedAt: new Date() }
        : feature
    ));
  };

  const addNote = (featureId: string) => {
    const noteContent = newNote[featureId]?.trim();
    if (!noteContent) return;

    const note: Note = {
      id: uuidv4(),
      content: noteContent,
      createdAt: new Date(),
    };

    setFeatures(features.map(feature =>
      feature.id === featureId
        ? { ...feature, notes: [...feature.notes, note], updatedAt: new Date() }
        : feature
    ));

    setNewNote({ ...newNote, [featureId]: '' });
  };

  const removeNote = (featureId: string, noteId: string) => {
    setFeatures(features.map(feature =>
      feature.id === featureId
        ? { ...feature, notes: feature.notes.filter(note => note.id !== noteId) }
        : feature
    ));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Stats Cards */}
      <div className="p-4 bg-white">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 text-white">
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-xs text-blue-100">Total Features</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 text-white">
            <div className="text-xl font-bold">{stats.completed}</div>
            <div className="text-xs text-green-100">Completed</div>
          </div>
        </div>

        {/* Add Feature Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Feature
        </button>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Feature List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredAndSortedFeatures.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No features yet</h3>
            <p className="text-gray-600 mb-4">Create your first feature to get started!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Add Your First Feature
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedFeatures.map((feature) => (
              <div key={feature.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${priorityColors[feature.priority]}`}>
                          {feature.priority.toUpperCase()}
                        </span>
                      </div>
                      {feature.description && (
                        <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <select
                          value={feature.status}
                          onChange={(e) => updateFeatureStatus(feature.id, e.target.value as Status)}
                          className="px-3 py-1 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${statusConfig[feature.status].bg}`}>
                          <span className={statusConfig[feature.status].color}>
                            {statusConfig[feature.status].icon}
                          </span>
                          <span className={`text-xs font-medium ${statusConfig[feature.status].color}`}>
                            {statusConfig[feature.status].label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                      className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                          expandedFeature === feature.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Notes Section */}
                {expandedFeature === feature.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <StickyNote className="w-4 h-4 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">Notes ({feature.notes.length})</h4>
                    </div>

                    {/* Existing Notes */}
                    <div className="space-y-2 mb-3">
                      {feature.notes.map((note) => (
                        <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{note.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {note.createdAt.toLocaleDateString()} {note.createdAt.toLocaleTimeString()}
                            </p>
                          </div>
                          <button
                            onClick={() => removeNote(feature.id, note.id)}
                            className="ml-2 p-1 hover:bg-red-100 rounded text-red-500 transition-colors duration-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Note Form */}
                    <div className="flex gap-2">
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
                        disabled={!newNote[feature.id]?.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
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

      {/* Add Feature Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Feature</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Feature title..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Feature description..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleAddFeature}
                disabled={!formData.title.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                Add Feature
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
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

export default FeatureList; 