import React, { useState } from 'react';
import { Users, Star, MessageCircle, Clock, DollarSign, Search, Filter, Mail, Phone, Globe, MapPin } from 'lucide-react';

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

    // Show success message
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Expert Hub</h2>
        <p className="text-sm text-gray-600 mb-4">
          Connect with experts, apply to become one, or get professional consulting
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Apply as an Expert</h3>
            </div>
            <p className="text-sm text-blue-700 mb-3">Join our network and share your expertise</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Expert Network</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Earn Money</span>
            </div>
            <button className="mt-3 bg-blue-900 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-800">
              Get Started
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-900">Browse Experts & Connect</h3>
            </div>
            <p className="text-sm text-green-700 mb-3">Find the right expert for your project</p>
            <div className="flex gap-2 items-center">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {experts.filter(e => e.availability === 'available').length} Available Now
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Instant Chat</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search experts or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as 'all' | 'available' | 'busy')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Max: $</span>
              <input
                type="number"
                value={maxRate}
                onChange={(e) => setMaxRate(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                min="0"
                max="500"
              />
              <span className="text-sm text-gray-600">/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expert List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredExperts.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No experts found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExperts.map((expert) => (
              <div key={expert.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{expert.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${availabilityColors[expert.availability]}`}>
                        {availabilityIcons[expert.availability]} {expert.availability}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{expert.title}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        {renderStars(expert.rating)}
                        <span className="ml-1">{expert.rating} ({expert.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${expert.hourlyRate}/hr</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{expert.location}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleContactExpert(expert)}
                    disabled={expert.availability === 'offline'}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    Contact
                  </button>
                </div>

                <p className="text-gray-700 text-sm mb-3">{expert.bio}</p>

                {/* Skills */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {expert.skills.map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Responds {expert.responseTime}</span>
                    </div>
                    <span>{expert.completedProjects} projects completed</span>
                    <span>Languages: {expert.languages.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {expert.portfolio && (
                      <a
                        href={expert.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Globe className="w-3 h-3" />
                      </a>
                    )}
                    {expert.email && (
                      <a
                        href={`mailto:${expert.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Mail className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      {showContactForm && selectedExpert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Contact {selectedExpert.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <select
                  value={contactForm.projectType}
                  onChange={(e) => setContactForm({ ...contactForm, projectType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select project type</option>
                  <option value="consulting">Consulting</option>
                  <option value="development">Development</option>
                  <option value="design">Design</option>
                  <option value="code-review">Code Review</option>
                  <option value="mentoring">Mentoring</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                <select
                  value={contactForm.budget}
                  onChange={(e) => setContactForm({ ...contactForm, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select budget</option>
                  <option value="<$1000">Less than $1,000</option>
                  <option value="$1000-$5000">$1,000 - $5,000</option>
                  <option value="$5000-$10000">$5,000 - $10,000</option>
                  <option value=">$10000">More than $10,000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                <select
                  value={contactForm.timeline}
                  onChange={(e) => setContactForm({ ...contactForm, timeline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select timeline</option>
                  <option value="asap">ASAP</option>
                  <option value="1-2weeks">1-2 weeks</option>
                  <option value="1month">1 month</option>
                  <option value="2-3months">2-3 months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  placeholder="Describe your project and requirements..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={submitContactRequest}
                disabled={!contactForm.message.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send Message
              </button>
              <button
                onClick={() => {
                  setShowContactForm(false);
                  setSelectedExpert(null);
                  setContactForm({ message: '', projectType: '', budget: '', timeline: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Consulting Section */}
      <div className="p-4 bg-purple-50 border-t border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-purple-600" />
          <h3 className="font-medium text-purple-900">Free Consulting & Quotes</h3>
        </div>
        <p className="text-sm text-purple-700 mb-3">
          Can't find the right expert? We'll help you
        </p>
        <div className="flex gap-2 mb-3">
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Free</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">24h Response</span>
        </div>
        <button className="bg-purple-900 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-800">
          Contact Us
        </button>
      </div>
    </div>
  );
};

export default ExpertHub; 