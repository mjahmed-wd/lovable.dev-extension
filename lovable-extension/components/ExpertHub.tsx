import React, { useState } from 'react';
import { UserPlus, Briefcase, CheckCircle, AlertCircle, Loader, ArrowLeftCircle } from 'lucide-react';
import { apiClient, HireExpertRequest, RegisterExpertRequest } from '../services/api';

type FormType = 'none' | 'hire' | 'register';
type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';

const ExpertHub: React.FC = () => {
  const [activeForm, setActiveForm] = useState<FormType>('none');
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [message, setMessage] = useState('');

  // Hire Expert Form State
  const [hireForm, setHireForm] = useState<HireExpertRequest>({
    name: '',
    email: '',
    company: '',
    projectType: '',
    budget: '',
    timeline: '',
    message: '',
  });

  // Register Expert Form State
  const [registerForm, setRegisterForm] = useState<RegisterExpertRequest>({
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: '',
    portfolio: '',
    hourlyRate: '',
    bio: '',
  });
  const [newSkill, setNewSkill] = useState('');

  const resetForms = () => {
    setHireForm({
      name: '',
      email: '',
      company: '',
      projectType: '',
      budget: '',
      timeline: '',
      message: '',
    });
    setRegisterForm({
      name: '',
      email: '',
      phone: '',
      skills: [],
      experience: '',
      portfolio: '',
      hourlyRate: '',
      bio: '',
    });
    setNewSkill('');
    setSubmissionStatus('idle');
    setMessage('');
  };

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('loading');
    try {
      const response = await apiClient.submitHireExpertRequest(hireForm);
      setSubmissionStatus('success');
      setMessage(response.data?.message || 'Your request has been submitted successfully!');
      resetForms();
      setTimeout(() => setActiveForm('none'), 3000);
    } catch (error) {
      setSubmissionStatus('error');
      setMessage('Failed to submit your request. Please try again.');
      console.error('Error submitting hire request:', error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('loading');
    try {
      const response = await apiClient.submitExpertRegistration(registerForm);
      setSubmissionStatus('success');
      setMessage(response.data?.message || 'Your registration has been submitted successfully!');
      resetForms();
      setTimeout(() => setActiveForm('none'), 3000);
    } catch (error) {
      setSubmissionStatus('error');
      setMessage('Failed to submit your registration. Please try again.');
      console.error('Error submitting registration:', error);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !registerForm.skills.includes(newSkill.trim())) {
      setRegisterForm({
        ...registerForm,
        skills: [...registerForm.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };
  const removeSkill = (skillToRemove: string) => {
    setRegisterForm({
      ...registerForm,
      skills: registerForm.skills.filter(skill => skill !== skillToRemove),
    });
  };

  // --- Main Option Screen ---
  if (activeForm === 'none') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-white to-blue-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-blue-700 tracking-tight">Expert Hub</h1>
            <p className="text-gray-600 text-sm">Lovable Ex Agency – Your gateway to top talent and consulting</p>
          </div>
        </div>
        {/* Main Content Scrollable */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)]">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            {/* Agency Callout */}
            <div className="bg-blue-100/60 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm">
              <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-blue-200">
                <Briefcase className="w-8 h-8 text-blue-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-blue-900 mb-1">Work with the Lovable Ex Agency</h2>
                <p className="text-gray-700 text-sm mb-1">We connect you with handpicked experts for your project or help you join our network of professionals. Let’s build something great together!</p>
                <ul className="text-xs text-blue-800 flex flex-wrap gap-3 mt-2">
                  <li>• Fast response</li>
                  <li>• Vetted talent</li>
                  <li>• Transparent process</li>
                  <li>• Personalized matching</li>
                </ul>
              </div>
            </div>
            {/* Options */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Hire Expert Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow hover:shadow-lg transition-shadow p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </span>
                  <h3 className="text-xl font-semibold text-blue-800">Hire an Expert</h3>
                </div>
                <p className="text-gray-600 mb-3 text-sm">Need help with your project? We’ll match you with the right expert for development, design, consulting, and more.</p>
                <ul className="text-xs text-gray-500 mb-4 space-y-1">
                  <li>• Full-stack developers</li>
                  <li>• UX/UI designers</li>
                  <li>• DevOps engineers</li>
                  <li>• Project managers</li>
                  <li>• Business consultants</li>
                </ul>
                <button
                  onClick={() => setActiveForm('hire')}
                  className="mt-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow"
                >
                  Get Started
                </button>
              </div>
              {/* Register as Expert Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow hover:shadow-lg transition-shadow p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                    <UserPlus className="w-6 h-6 text-green-600" />
                  </span>
                  <h3 className="text-xl font-semibold text-green-800">Register as an Expert</h3>
                </div>
                <p className="text-gray-600 mb-3 text-sm">Join our network and get matched with exciting projects. Set your own rates and work flexibly with top clients.</p>
                <ul className="text-xs text-gray-500 mb-4 space-y-1">
                  <li>• Flexible work</li>
                  <li>• Competitive pay</li>
                  <li>• Diverse opportunities</li>
                  <li>• Professional growth</li>
                  <li>• Community support</li>
                </ul>
                <button
                  onClick={() => setActiveForm('register')}
                  className="mt-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Hire an Expert Form ---
  if (activeForm === 'hire') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-white to-blue-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setActiveForm('none')}
              className="p-2 text-blue-500 hover:text-blue-700 rounded-full focus:outline-none"
              aria-label="Back"
            >
              <ArrowLeftCircle className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-blue-700">Hire an Expert</h1>
              <p className="text-xs text-gray-500">Tell us about your project and we’ll connect you with the right talent</p>
            </div>
          </div>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)]">
          <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Intro Section */}
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h2 className="text-base font-semibold text-blue-800 mb-1">How it works</h2>
              <ul className="text-xs text-blue-700 space-y-1 pl-4 list-disc">
                <li>Fill out the form below with your project details</li>
                <li>Our team will review and match you with the best expert(s)</li>
                <li>You’ll receive a response within 24 hours</li>
              </ul>
            </div>
            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
              {submissionStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h3>
                  <p className="text-gray-600 max-w-md text-center">{message}</p>
                </div>
              ) : (
                <form onSubmit={handleHireSubmit} className="space-y-6">
                  {submissionStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">{message}</span>
                    </div>
                  )}
                  {/* Contact Info */}
                  <div>
                    <h4 className="text-blue-700 font-semibold mb-2 text-sm">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={hireForm.name}
                          onChange={(e) => setHireForm({ ...hireForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={hireForm.email}
                          onChange={(e) => setHireForm({ ...hireForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Project Details */}
                  <div>
                    <h4 className="text-blue-700 font-semibold mb-2 text-sm">Project Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Company (Optional)</label>
                        <input
                          type="text"
                          value={hireForm.company}
                          onChange={(e) => setHireForm({ ...hireForm, company: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Your company name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Project Type *</label>
                        <input
                          type="text"
                          required
                          value={hireForm.projectType}
                          onChange={(e) => setHireForm({ ...hireForm, projectType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="e.g., Web Development"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Budget *</label>
                        <input
                          type="text"
                          required
                          value={hireForm.budget}
                          onChange={(e) => setHireForm({ ...hireForm, budget: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="e.g., $5,000 - $10,000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Timeline *</label>
                        <input
                          type="text"
                          required
                          value={hireForm.timeline}
                          onChange={(e) => setHireForm({ ...hireForm, timeline: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="e.g., 2-3 weeks"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Project Description *</label>
                      <textarea
                        required
                        value={hireForm.message}
                        onChange={(e) => setHireForm({ ...hireForm, message: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        rows={4}
                        placeholder="Describe your project requirements, goals, and any specific expertise needed..."
                      />
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveForm('none')}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submissionStatus === 'loading'}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      {submissionStatus === 'loading' ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Register as Expert Form ---
  if (activeForm === 'register') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-white to-green-50">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setActiveForm('none')}
              className="p-2 text-green-500 hover:text-green-700 rounded-full focus:outline-none"
              aria-label="Back"
            >
              <ArrowLeftCircle className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-green-700">Register as an Expert</h1>
              <p className="text-xs text-gray-500">Share your expertise and join our network</p>
            </div>
          </div>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-64px)]">
          <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Intro Section */}
            <div className="mb-6 bg-green-50 border border-green-100 rounded-lg p-4">
              <h2 className="text-base font-semibold text-green-800 mb-1">Why join Lovable Ex?</h2>
              <ul className="text-xs text-green-700 space-y-1 pl-4 list-disc">
                <li>Get matched with projects that fit your skills</li>
                <li>Set your own rates and work flexibly</li>
                <li>Grow your professional network and reputation</li>
              </ul>
            </div>
            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
              {submissionStatus === 'success' ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Submitted!</h3>
                  <p className="text-gray-600 max-w-md text-center">{message}</p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  {submissionStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">{message}</span>
                    </div>
                  )}
                  {/* Personal Info */}
                  <div>
                    <h4 className="text-green-700 font-semibold mb-2 text-sm">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone (Optional)</label>
                        <input
                          type="tel"
                          value={registerForm.phone}
                          onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Years of Experience *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.experience}
                          onChange={(e) => setRegisterForm({ ...registerForm, experience: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="e.g., 5+ years"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Professional Details */}
                  <div>
                    <h4 className="text-green-700 font-semibold mb-2 text-sm">Professional Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Portfolio URL (Optional)</label>
                        <input
                          type="url"
                          value={registerForm.portfolio}
                          onChange={(e) => setRegisterForm({ ...registerForm, portfolio: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Hourly Rate (Optional)</label>
                        <input
                          type="text"
                          value={registerForm.hourlyRate}
                          onChange={(e) => setRegisterForm({ ...registerForm, hourlyRate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="e.g., $75/hour"
                        />
                      </div>
                    </div>
                    {/* Skills */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Skills *</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="Add a skill (e.g., React)"
                        />
                        <button
                          type="button"
                          onClick={addSkill}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Add
                        </button>
                      </div>
                      {registerForm.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {registerForm.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm flex items-center gap-1"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="text-green-600 hover:text-green-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {registerForm.skills.length === 0 && (
                        <p className="text-sm text-gray-500">At least one skill is required</p>
                      )}
                    </div>
                    {/* Bio */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Professional Bio *</label>
                      <textarea
                        required
                        value={registerForm.bio}
                        onChange={(e) => setRegisterForm({ ...registerForm, bio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        rows={4}
                        placeholder="Tell us about your professional background, expertise, and what makes you unique..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 50 characters ({registerForm.bio.length}/50)
                      </p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveForm('none')}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submissionStatus === 'loading' || registerForm.skills.length === 0 || registerForm.bio.length < 50}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      {submissionStatus === 'loading' ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ExpertHub; 