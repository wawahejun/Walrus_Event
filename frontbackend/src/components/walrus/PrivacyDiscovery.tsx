import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ParallaxScrollSecond } from '../ui/parallax-scroll';
import { ArrowRight, Users, Calendar, MapPin, Clock, Sparkles, TrendingUp, ClockIcon } from 'lucide-react';
import { EventDetailModal } from './EventDetailModal';
import { StackedCircularFooter } from '../ui/stacked-circular-footer';

export interface Activity {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  date: string;
  location: string;
  participants: number;
  maxParticipants: number;
  tags: string[];
  recommendationScore?: number;
  time: string;
  duration?: string;
  organizer?: string;
  price?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  rating?: number;
  reviews?: number;
  organizerAddress?: string; // Full address for transactions
}

const mockActivityPool: Activity[] = [
  {
    id: '1',
    title: 'Privacy Computing Workshop',
    description: 'Learn the fundamentals of zero-knowledge proofs and homomorphic encryption to protect your data privacy',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
    category: 'Workshop',
    date: '2025-12-15',
    location: 'Virtual Meeting',
    participants: 45,
    maxParticipants: 100,
    tags: ['Privacy Protection', 'Zero-Knowledge Proofs', 'Cryptography'],
    recommendationScore: 98,
    time: '14:00-17:00',
    duration: '3 Hours',
    organizer: 'CircleSoft Lab'
  },
  {
    id: '2',
    title: 'Data Sovereignty Seminar',
    description: 'Explore data ownership and decentralized identity authentication in the Web3 era',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280&h=720&fit=crop&auto=format&q=80',
    category: 'Seminar',
    date: '2025-12-18',
    location: 'Web3 Hub',
    participants: 89,
    maxParticipants: 150,
    tags: ['Data Sovereignty', 'DID', 'Web3', 'Blockchain'],
    recommendationScore: 95,
    time: '19:00-21:00',
    duration: '2 Hours',
    organizer: 'Web3 Community'
  },
  {
    id: '3',
    title: 'Anonymous Voting System Experience',
    description: 'Experience the application of zero-knowledge proofs in anonymous voting scenarios',
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1280&h=720&fit=crop&auto=format&q=80',
    category: 'Experience',
    date: '2026-01-20',
    location: 'Privacy Computing Lab',
    participants: 23,
    maxParticipants: 50,
    tags: ['Zero-Knowledge Proofs', 'Anonymous Voting', 'Privacy Protection'],
    recommendationScore: 92,
    time: '10:00-12:00',
    duration: '2 Hours',
    organizer: 'CircleSoft Team'
  },
  {
    id: '4',
    title: 'Privacy Protection Programming Challenge',
    description: '24-hour hackathon to develop innovative privacy protection solutions',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1280&h=720&fit=crop&auto=format&q=80',
    category: 'Hackathon',
    date: '2026-01-25',
    location: 'CircleSoft Headquarters',
    participants: 156,
    maxParticipants: 200,
    tags: ['Programming', 'Challenge', 'Privacy Protection', 'Innovation'],
    recommendationScore: 90,
    time: 'All Day',
    duration: '24 Hours',
    organizer: 'CircleSoft Dev Team'
  },
  {
    id: '5',
    title: 'Decentralized Identity Authentication Demo',
    description: 'Learn about the latest decentralized identity authentication technologies',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1280&h=720&fit=crop&auto=format&q=80',
    category: 'Demo',
    date: '2026-01-16',
    location: 'Online Demo',
    participants: 67,
    maxParticipants: 80,
    tags: ['DID', 'Identity Authentication', 'Decentralization', 'Web3'],
    recommendationScore: 88,
    time: '15:00-16:30',
    duration: '1.5 Hours',
    organizer: 'DID Technical Committee'
  },
  {
    id: '6',
    title: 'Privacy-Preserving Data Analytics Training',
    description: 'Learn how to use differential privacy for data analysis while protecting privacy',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&auto=format&q=80',
    category: 'Training',
    date: '2026-01-22',
    location: 'Online Course',
    participants: 34,
    maxParticipants: 60,
    tags: ['Data Analytics', 'Differential Privacy', 'Privacy Protection', 'Machine Learning'],
    recommendationScore: 87,
    time: '20:00-22:00',
    duration: '2 Hours',
    organizer: 'Data Privacy Research Institute'
  },
  {
    id: '7',
    title: 'Web3 Privacy Infrastructure Sharing',
    description: 'Explore privacy infrastructure in Web3 ecosystem including computing, storage and protocols',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1280&h=720&fit=crop&auto=format&q=80',
    category: 'Sharing',
    date: '2026-01-19',
    location: 'Web3DAO',
    participants: 78,
    maxParticipants: 100,
    tags: ['Web3', 'Privacy Infrastructure', 'Protocols', 'Decentralization'],
    recommendationScore: 85,
    time: '18:00-20:00',
    duration: '2 Hours',
    organizer: 'Web3DAO Technical Committee'
  },
  {
    id: '8',
    title: 'Zero Knowledge Proof Workshop',
    description: 'Hands-on workshop on implementing ZK circuits using Circom and SnarkJS',
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1280&h=720&fit=crop&auto=format&q=80',
    category: 'Workshop',
    date: '2026-02-05',
    location: 'DevHub',
    participants: 42,
    maxParticipants: 60,
    tags: ['ZK', 'Circom', 'Cryptography', 'Coding'],
    recommendationScore: 94,
    time: '13:00-17:00',
    duration: '4 Hours',
    organizer: 'ZK Builders'
  },
  {
    id: '9',
    title: 'Privacy in AI Conference',
    description: 'Discussing the intersection of Artificial Intelligence and Privacy Protection',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&h=720&fit=crop&auto=format&q=80',
    category: 'Conference',
    date: '2026-02-12',
    location: 'Tech Center',
    participants: 210,
    maxParticipants: 300,
    tags: ['AI', 'Privacy', 'Ethics', 'Future Tech'],
    recommendationScore: 91,
    time: '09:00-18:00',
    duration: '9 Hours',
    organizer: 'AI Ethics Board'
  }
];

const getMockActivities = (): Activity[] => mockActivityPool.map(activity => ({ ...activity }));

const ensureVariedActivities = (baseActivities: Activity[], desiredCount = 9): Activity[] => {
  // If we have enough base activities, just return them
  if (baseActivities.length >= desiredCount) {
    return baseActivities.slice(0, desiredCount);
  }

  const enriched = [...baseActivities];
  const existingIds = new Set(enriched.map(activity => activity.id));
  const mockPool = getMockActivities();

  // Filter out mock activities that are already in the base set (by title/content similarity if needed, but here just ID)
  const availableMocks = mockPool.filter(m => !existingIds.has(m.id));

  // Add available mocks until we reach desired count or run out of mocks
  for (const mock of availableMocks) {
    if (enriched.length >= desiredCount) break;
    enriched.push(mock);
    existingIds.add(mock.id);
  }

  return enriched;
};

const PrivacyDiscovery: React.FC = () => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  // Initialize with mock data to ensure immediate visibility
  const [activities, setActivities] = useState<Activity[]>(ensureVariedActivities(getMockActivities()));

  // Fetch events from backend API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log("Fetching events...");
        const response = await fetch('http://localhost:8000/api/v1/events?limit=20');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Events data:", data);

        if (data.status === 'success' && Array.isArray(data.events)) {
          // Transform backend events to Activity format
          const transformedActivities: Activity[] = data.events.map((event: any) => {
            console.log(`Event "${event.title}" - price from backend:`, event.price, 'MIST');
            return {
              id: event.event_id,
              title: event.title,
              description: event.description,
              image: event.cover_image_path || event.cover_image || `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}?w=1280&h=720&fit=crop&auto=format&q=80`,
              category: event.event_type,
              date: new Date(event.start_time).toISOString().split('T')[0],
              location: event.location || 'Virtual',
              participants: event.participants_count || 0,
              maxParticipants: event.max_participants,
              tags: event.tags || [event.event_type, 'Privacy', 'Web3'],
              recommendationScore: 85 + Math.floor(Math.random() * 15),
              time: new Date(event.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              duration: '2-3 Hours',
              organizer: event.organizer_id ? event.organizer_id.substring(0, 10) + '...' : 'Unknown',
              organizerAddress: event.organizer_id, // Full address
              price: event.price || 0  // Add price field
            };
          });

          console.log("Transformed activities:", transformedActivities);
          setActivities(ensureVariedActivities(transformedActivities));
        } else {
          console.warn("Invalid data format from API, using mocks");
          setActivities(ensureVariedActivities(getMockActivities()));
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
        // Fallback to mock data if API fails
        setActivities(ensureVariedActivities(getMockActivities()));
      }
    };

    fetchEvents();
  }, []);

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowActivityDetail(true);
  };
  const recommendedForYou = activities.filter(a => (a.recommendationScore || 0) >= 90);
  const trendingActivities = activities.slice().sort((a, b) => b.participants - a.participants).slice(0, 5);
  const newActivities = activities.slice(-3);
  const popularInArea = activities.filter(a => a.tags.includes('Web3') || a.tags.includes('隐私保护')).slice(0, 4);

  const parallaxScrollImages = newActivities.map((activity) =>
    activity.image
  );

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Privacy Discovery
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore privacy protection technologies and discover activities recommended just for you
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8 flex items-center justify-center gap-2 text-amber-600"
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-lg font-medium">Smart recommendations based on your interests</span>
        </motion.div>

        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Recommended for You
              <span className="text-sm font-normal text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                High Match
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedForYou.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => handleActivityClick(activity)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-amber-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Recommended
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-600 transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {activity.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{activity.participants} / {activity.maxParticipants}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{activity.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 my-16"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Smart Recommendation Algorithm</h3>
                <p className="text-gray-800">
                  Precisely recommend the most relevant activities based on your interests, participation history, and behavioral data
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Real-time Updates</h3>
                <p className="text-gray-800">
                  Recommendation results adjust in real-time based on your latest interactions, ensuring you always discover the newest and hottest activities
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-800">Latest Activities</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <ParallaxScrollSecond
              images={parallaxScrollImages}
              imageData={newActivities}
              onImageClick={(data) => {
                handleActivityClick(data);
              }}
            />
          </motion.div>
        </section>

        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-800">Trending Activities</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                onClick={() => handleActivityClick(activity)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-amber-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Trending
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-600 transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {activity.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{activity.participants} / {activity.maxParticipants}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{activity.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
            <h2 className="text-2xl font-bold text-gray-800">Popular in Your Area</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularInArea.map(activity => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative bg-white rounded-2xl overflow-hidden shadow-lg border border-amber-200 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 relative">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-32 md:h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Nearby
                    </div>
                  </div>
                  <div className="md:w-2/3 p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{activity.title}</h3>
                    <p className="text-gray-800 text-sm mb-3 line-clamp-2">{activity.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {activity.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleActivityClick(activity)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 hover:from-amber-600 hover:to-orange-600 transition-all duration-300"
                      >
                        View Details
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Inline modal removed in favor of EventDetailModal */}

      {/* Event Detail Modal - New Component */}
      <EventDetailModal
        event={selectedActivity}
        isOpen={showActivityDetail}
        onClose={() => setShowActivityDetail(false)}
        onEventUpdate={(updatedEvent) => {
          setActivities(prev => prev.map(a => a.id === updatedEvent.id ? updatedEvent : a));
          setSelectedActivity(updatedEvent);
        }}
      />
      <StackedCircularFooter />
    </div>
  );
};

export default PrivacyDiscovery;
