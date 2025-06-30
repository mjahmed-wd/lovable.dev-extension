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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Expert Hub</h1>
        <p className="text-sm text-gray-600">
          Connect with experts, apply to become one, or get professional consulting
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Apply as an Expert Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Apply as an Expert</h3>
                <p className="text-gray-600 mb-4">Join our network and share your expertise</p>
                
                <div className="flex gap-3 mb-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Expert Network</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Earn Money</span>
                </div>
                
                <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                  Get Started
                </button>
              </div>
            </div>
          </div>

          {/* Browse Experts & Connect Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Browse Experts & Connect</h3>
                <p className="text-gray-600 mb-4">Find the right expert for your project</p>
                
                <div className="flex gap-3 mb-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {availableCount} Available
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Instant Chat</span>
                </div>
                
                <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                  Browse
                </button>
              </div>
            </div>
          </div>

          {/* Free Consulting & Quotes Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Free Consulting & Quotes</h3>
                <p className="text-gray-600 mb-4">Can't find the right expert? We'll help you</p>
                
                <div className="flex gap-3 mb-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Free</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">24h Response</span>
                </div>
                
                <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{experts.length} Experts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">{availableCount} Available Now</span>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && selectedExpert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contact {selectedExpert.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <input
                  type="text"
                  value={contactForm.projectType}
                  onChange={(e) => setContactForm({ ...contactForm, projectType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Web Development, Consulting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="text"
                  value={contactForm.budget}
                  onChange={(e) => setContactForm({ ...contactForm, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., $5,000 - $10,000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                <input
                  type="text"
                  value={contactForm.timeline}
                  onChange={(e) => setContactForm({ ...contactForm, timeline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 2-3 weeks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
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
                onClick={() => {
                  setShowContactForm(false);
                  setSelectedExpert(null);
                  setContactForm({ message: '', projectType: '', budget: '', timeline: '' });
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitContactRequest}
                disabled={!contactForm.message.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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