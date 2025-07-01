import React, { useState } from 'react';
import { Users, Star, MessageCircle, Clock, DollarSign, Search, Filter, Mail, Phone, Globe, MapPin, UserPlus, Users2, Headphones } from 'lucide-react';

interface Expert {
  id: string;
  name: string;
  title: string;
  skills: string[];
  rating: number;
  reviews: number;
  hourlyRate: number;
  location: string;
  availability: 'available' | 'busy' | 'offline';
  bio: string;
  portfolio?: string;
  email?: string;
  phone?: string;
  languages: string[];
  responseTime: string;
  completedProjects: number;
}

interface ContactRequest {
  expertId: string;
  message: string;
  projectType: string;
  budget: string;
  timeline: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

const ExpertHub: React.FC = () => {
  const [experts] = useState<Expert[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'Senior Full-Stack Developer',
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
      rating: 4.9,
      reviews: 127,
      hourlyRate: 85,
      location: 'San Francisco, CA',
      availability: 'available',
      bio: 'Experienced full-stack developer with 8+ years building scalable web applications. Specialized in React ecosystem and cloud architecture.',
      portfolio: 'https://sarahjohnson.dev',
      email: 'sarah@example.com',
      languages: ['English', 'Spanish'],
      responseTime: '< 2 hours',
      completedProjects: 150,
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'DevOps Engineer & Cloud Architect',
      skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
      rating: 4.8,
      reviews: 89,
      hourlyRate: 95,
      location: 'Seattle, WA',
      availability: 'busy',
      bio: 'DevOps specialist helping companies scale their infrastructure. Expert in containerization and automated deployment pipelines.',
      portfolio: 'https://michaelchen.cloud',
      email: 'michael@example.com',
      languages: ['English', 'Mandarin'],
      responseTime: '< 4 hours',
      completedProjects: 75,
    },
    {
      id: '3',
      name: 'Elena Rodriguez',
      title: 'UX/UI Designer & Frontend Developer',
      skills: ['Figma', 'React', 'CSS', 'Design Systems', 'User Research'],
      rating: 4.9,
      reviews: 203,
      hourlyRate: 75,
      location: 'Austin, TX',
      availability: 'available',
      bio: 'Creative designer with a strong frontend development background. I create beautiful, user-centered digital experiences.',
      portfolio: 'https://elenadesigns.com',
      email: 'elena@example.com',
      languages: ['English', 'Spanish', 'Portuguese'],
      responseTime: '< 1 hour',
      completedProjects: 180,
    },
    {
      id: '4',
      name: 'Alex Thompson',
      title: 'Mobile App Developer',
      skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Firebase'],
      rating: 4.7,
      reviews: 156,
      hourlyRate: 80,
      location: 'Toronto, ON',
      availability: 'available',
      bio: 'Mobile development expert with expertise in cross-platform solutions. Built 50+ mobile apps for startups and enterprises.',
      portfolio: 'https://alexapps.dev',
      email: 'alex@example.com',
      languages: ['English', 'French'],
      responseTime: '< 3 hours',
      completedProjects: 95,
    },
  ]);

  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'busy'>('all');
  const [maxRate, setMaxRate] = useState<number>(200);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    message: '',
    projectType: '',
    budget: '',
    timeline: '',
  });

  const availabilityColors = {
    available: 'bg-green-100 text-green-800',
    busy: 'bg-yellow-100 text-yellow-800',
    offline: 'bg-gray-100 text-gray-800',
  };

  const availabilityIcons = {
    available: '🟢',
    busy: '🟡',
    offline: '⚫',
  };

  // Get all unique skills for filter
  const allSkills = [...new Set(experts.flatMap(expert => expert.skills))];

  const filteredExperts = experts.filter(expert => {
    const nameMatch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     expert.title.toLowerCase().includes(searchTerm.toLowerCase());
    const skillMatch = skillFilter === '' || expert.skills.some(skill => 
      skill.toLowerCase().includes(skillFilter.toLowerCase()));
    const availabilityMatch = availabilityFilter === 'all' || expert.availability === availabilityFilter;
    const rateMatch = expert.hourlyRate <= maxRate;
    
    return nameMatch && skillMatch && availabilityMatch && rateMatch;
  });

  const availableCount = experts.filter(e => e.availability === 'available').length;

  const handleContactExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setShowContactForm(true);
  };

  const submitContactRequest = () => {
    if (!selectedExpert || !contactForm.message.trim()) return;

    const newRequest: ContactRequest = {
      expertId: selectedExpert.id,
      message: contactForm.message,
      projectType: contactForm.projectType,
      budget: contactForm.budget,
      timeline: contactForm.timeline,
      status: 'pending',
      createdAt: new Date(),
    };

    setContactRequests([...contactRequests, newRequest]);
    setContactForm({ message: '', projectType: '', budget: '', timeline: '' });
    setShowContactForm(false);
    setSelectedExpert(null);

    alert(`Your message has been sent to ${selectedExpert.name}. They will respond within ${selectedExpert.responseTime}.`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Expert Hub</h1>
        <p className="text-sm text-gray-600">
          Connect with experts, apply to become one, or get professional consulting
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search experts..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as 'all' | 'available' | 'busy')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Max Rate:</span>
              <input
                type="range"
                min="50"
                max="200"
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-900 w-12">${maxRate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-3">
            {/* Apply as an Expert Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm mb-1">Become an Expert</h3>
                  <p className="text-xs text-gray-600 mb-2">Share your expertise and help others while earning money</p>
                  <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Apply Now
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">{experts.length}</div>
                <div className="text-xs text-gray-600">Total Experts</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="text-lg font-semibold text-green-600">{availableCount}</div>
                <div className="text-xs text-gray-600">Available Now</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <div className="text-lg font-semibold text-gray-900">{filteredExperts.length}</div>
                <div className="text-xs text-gray-600">Filtered Results</div>
              </div>
            </div>

            {/* Experts List */}
            {filteredExperts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No experts found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExperts.map((expert) => (
                  <div key={expert.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 text-sm">{expert.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${availabilityColors[expert.availability]}`}>
                            {availabilityIcons[expert.availability]} {expert.availability}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{expert.title}</p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {renderStars(expert.rating)}
                            <span className="text-xs text-gray-600">({expert.reviews})</span>
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-medium text-gray-900">${expert.hourlyRate}/hr</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600">{expert.responseTime}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {expert.skills.slice(0, 4).map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {expert.skills.length > 4 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              +{expert.skills.length - 4} more
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2">{expert.bio}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {expert.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users2 className="w-3 h-3" />
                          {expert.completedProjects} projects
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {expert.portfolio && (
                          <a
                            href={expert.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                          >
                            <Globe className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => handleContactExpert(expert)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                        >
                          Contact
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && selectedExpert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Contact {selectedExpert.name}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <input
                  type="text"
                  value={contactForm.projectType}
                  onChange={(e) => setContactForm({ ...contactForm, projectType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., Web Development, Consulting"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="text"
                  value={contactForm.budget}
                  onChange={(e) => setContactForm({ ...contactForm, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., $5,000 - $10,000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                <input
                  type="text"
                  value={contactForm.timeline}
                  onChange={(e) => setContactForm({ ...contactForm, timeline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., 2-3 weeks"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  rows={3}
                  placeholder="Describe your project and requirements..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowContactForm(false)}
                className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitContactRequest}
                disabled={!contactForm.message.trim()}
                className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertHub; 