import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  TrendingUp, 
  Users, 
  MapPin, 
  DollarSign,
  Zap,
  Shield,
  Award,
  AlertCircle,
  Timer,
  Eye,
  Heart,
  Share2,
  Filter,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useMarketplaceStore } from '@/store/marketplaceStore';
import { useAuthStore } from '@/store/authStore';
import { Textarea } from '@/components/ui/textarea';

interface LiveProject {
  id: string;
  title: string;
  description: string;
  client: {
    name: string;
    verified: boolean;
    rating: number;
    projectsPosted: number;
  };
  budget: {
    min: number;
    max: number;
    type: 'fixed' | 'hourly' | 'milestone';
  };
  timeline: {
    duration: number;
    unit: 'days' | 'weeks' | 'months';
    urgency: 'normal' | 'urgent' | 'flexible';
  };
  location: {
    state: string;
    city: string;
    remote: boolean;
  };
  category: string;
  skills: string[];
  bids: {
    count: number;
    average: number;
    trending: boolean;
  };
  viralMetrics: {
    views: number;
    saves: number;
    shares: number;
    aiMatchScore: number;
  };
  timeLeft: number; // in hours
  featured: boolean;
  instantHire: boolean;
}

const MarketplaceLive: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, placeBid, instantHire, userBids } = useMarketplaceStore();
  const [selectedProject, setSelectedProject] = useState<LiveProject | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [budgetRange, setBudgetRange] = useState([0, 100000]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
  const [showBidModal, setShowBidModal] = useState(false);

  // Mock live projects data
  const [liveProjects] = useState<LiveProject[]>([
    {
      id: '1',
      title: 'Luxury Condominium Interior Design - KLCC Area',
      description: 'Need creative interior designer for 3000sqft luxury condo with modern tropical theme',
      client: {
        name: 'PropCo Development',
        verified: true,
        rating: 4.8,
        projectsPosted: 23
      },
      budget: {
        min: 80000,
        max: 120000,
        type: 'fixed'
      },
      timeline: {
        duration: 3,
        unit: 'months',
        urgency: 'normal'
      },
      location: {
        state: 'Kuala Lumpur',
        city: 'KLCC',
        remote: false
      },
      category: 'Interior Design',
      skills: ['3D Visualization', 'AutoCAD', 'Tropical Modern', 'Luxury Residential'],
      bids: {
        count: 12,
        average: 95000,
        trending: true
      },
      viralMetrics: {
        views: 3420,
        saves: 89,
        shares: 23,
        aiMatchScore: 92
      },
      timeLeft: 48,
      featured: true,
      instantHire: false
    },
    {
      id: '2',
      title: 'Heritage Shophouse Restoration - George Town',
      description: 'Seeking architect with heritage conservation experience for UNESCO zone shophouse',
      client: {
        name: 'Heritage Holdings',
        verified: true,
        rating: 4.9,
        projectsPosted: 15
      },
      budget: {
        min: 150000,
        max: 200000,
        type: 'milestone'
      },
      timeline: {
        duration: 6,
        unit: 'months',
        urgency: 'normal'
      },
      location: {
        state: 'Penang',
        city: 'George Town',
        remote: false
      },
      category: 'Architecture',
      skills: ['Heritage Conservation', 'Structural Analysis', 'Traditional Crafts', 'UNESCO Guidelines'],
      bids: {
        count: 8,
        average: 175000,
        trending: false
      },
      viralMetrics: {
        views: 2100,
        saves: 156,
        shares: 45,
        aiMatchScore: 88
      },
      timeLeft: 72,
      featured: true,
      instantHire: true
    },
    {
      id: '3',
      title: 'Modern Minimalist Home - Urgent Project',
      description: 'Fast-track residential project needs immediate architect and designer team',
      client: {
        name: 'Private Client',
        verified: false,
        rating: 0,
        projectsPosted: 1
      },
      budget: {
        min: 50000,
        max: 70000,
        type: 'fixed'
      },
      timeline: {
        duration: 2,
        unit: 'months',
        urgency: 'urgent'
      },
      location: {
        state: 'Selangor',
        city: 'Petaling Jaya',
        remote: true
      },
      category: 'Residential',
      skills: ['Fast Track', 'Minimalist Design', 'BIM', 'Project Management'],
      bids: {
        count: 23,
        average: 62000,
        trending: true
      },
      viralMetrics: {
        views: 4560,
        saves: 123,
        shares: 67,
        aiMatchScore: 85
      },
      timeLeft: 24,
      featured: false,
      instantHire: true
    }
  ]);

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      liveProjects.forEach(project => {
        const hours = project.timeLeft;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        newTimeRemaining[project.id] = days > 0 
          ? `${days}d ${remainingHours}h`
          : `${remainingHours}h`;
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [liveProjects]);

  const handleQuickBid = (project: LiveProject) => {
    const amount = project.bids.average || ((project.budget.min + project.budget.max) / 2);
    
    if (!user) {
      toast.error('Please login to place a bid');
      return;
    }
    
    // Check if user already bid on this project
    const existingBid = userBids.find(bid => bid.projectId === project.id && bid.userId === user.id);
    if (existingBid) {
      toast.error('You have already placed a bid on this project');
      return;
    }
    
    placeBid(project.id, {
      userId: user.id || 'user123',
      userName: `${user.firstName} ${user.lastName}`,
      amount: amount,
      message: `I am interested in your project and can deliver high-quality results within your timeline. My proposed bid is RM ${amount.toLocaleString()}.`
    });
    
    toast.success(`Quick bid placed for ${project.title}`, {
      description: `Your AI-optimized bid of RM ${amount.toLocaleString()} has been submitted`
    });
  };
  
  const handleCustomBid = () => {
    if (!selectedProject || !bidAmount || !bidMessage) {
      toast.error('Please fill in all bid details');
      return;
    }
    
    if (!user) {
      toast.error('Please login to place a bid');
      return;
    }
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    
    placeBid(selectedProject.id, {
      userId: user.id || 'user123',
      userName: `${user.firstName} ${user.lastName}`,
      amount: amount,
      message: bidMessage
    });
    
    toast.success('Bid placed successfully!', {
      description: `Your bid of RM ${amount.toLocaleString()} has been submitted`
    });
    
    setShowBidModal(false);
    setBidAmount('');
    setBidMessage('');
    setSelectedProject(null);
  };

  const handleInstantHire = (project: LiveProject) => {
    if (!user) {
      toast.error('Please login to use instant hire');
      return;
    }
    
    instantHire(project.id, user.id || 'user123');
    
    toast.success('Instant Hire Request Sent!', {
      description: 'Processing your request. You will be notified once approved.'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Real-time Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Live Marketplace</h1>
            <p className="text-gray-600 mt-2">Real-time project bidding with AI matching</p>
          </div>
          <div className="flex gap-3">
            <Badge className="px-4 py-2 bg-green-100 text-green-700">
              <Clock className="h-4 w-4 mr-2" />
              342 Live Projects
            </Badge>
            <Badge className="px-4 py-2 bg-blue-100 text-blue-700">
              <Users className="h-4 w-4 mr-2" />
              1,247 Active Bidders
            </Badge>
          </div>
        </div>

        {/* Live Activity Ticker */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Zap className="h-5 w-5 text-purple-600 animate-pulse" />
                <div className="flex gap-6 text-sm">
                  <span className="text-purple-700">
                    <strong>Ahmad R.</strong> just won "Modern Office Design" - RM 85,000
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-700">
                    <strong>Michelle T.</strong> placed bid on "Boutique Hotel Renovation"
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-700">
                    <strong>3 new projects</strong> posted in last hour
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Sorting */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="architecture">Architecture</SelectItem>
                    <SelectItem value="interior">Interior Design</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Budget Range (RM)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    value={budgetRange[0]}
                    className="w-24"
                  />
                  <span>-</span>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    value={budgetRange[1]}
                    className="w-24"
                  />
                </div>
              </div>

              <div>
                <Label>Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="kl">Kuala Lumpur</SelectItem>
                    <SelectItem value="selangor">Selangor</SelectItem>
                    <SelectItem value="penang">Penang</SelectItem>
                    <SelectItem value="johor">Johor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sort By</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="AI Match Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai-match">AI Match Score</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="ending-soon">Ending Soon</SelectItem>
                    <SelectItem value="budget-high">Budget (High to Low)</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-2 space-y-4">
            {liveProjects.map((project) => (
              <Card 
                key={project.id}
                className={`hover:shadow-lg transition-all cursor-pointer ${
                  project.featured ? 'border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50' : ''
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {project.featured && (
                          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                            Featured
                          </Badge>
                        )}
                        {project.instantHire && (
                          <Badge className="bg-green-500 text-white">
                            <Zap className="h-3 w-3 mr-1" />
                            Instant Hire
                          </Badge>
                        )}
                        {project.bids.trending && (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <CardDescription className="mt-1">{project.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        <Timer className="h-3 w-3 mr-1" />
                        {timeRemaining[project.id] || `${project.timeLeft}h`}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Budget</p>
                      <p className="font-semibold">
                        RM {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Timeline</p>
                      <p className="font-semibold">
                        {project.timeline.duration} {project.timeline.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Location</p>
                      <p className="font-semibold flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {project.location.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Bids</p>
                      <p className="font-semibold">{project.bids.count} bids</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {project.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.skills.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {project.viralMetrics.views}
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {project.viralMetrics.saves}
                      </span>
                      <span className="flex items-center">
                        <Share2 className="h-4 w-4 mr-1" />
                        {project.viralMetrics.shares}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 mr-2">AI Match</span>
                        <div className="w-20">
                          <Progress value={project.viralMetrics.aiMatchScore} className="h-2" />
                        </div>
                        <span className="text-xs font-semibold ml-2">
                          {project.viralMetrics.aiMatchScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setShowBidModal(true);
                      }}
                    >
                      Place Bid
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickBid(project);
                      }}
                    >
                      Quick Bid
                    </Button>
                    {project.instantHire && (
                      <Button 
                        variant="outline" 
                        className="border-green-500 text-green-600 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstantHire(project);
                        }}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Instant Hire
                      </Button>
                    )}
                    <Button variant="outline" size="icon">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Perfect Match Found!</span>
                      <Badge className="bg-green-100 text-green-700">95% Match</Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      "Luxury Condo KLCC" matches your portfolio perfectly. Similar to your Pavilion project.
                    </p>
                    <Button size="sm" className="w-full mt-2">View Details</Button>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-semibold mb-1">Bidding Strategy</p>
                    <p className="text-xs text-gray-600">
                      Based on market analysis, bid RM 92,000-98,000 for optimal win rate (73% probability)
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-semibold mb-1">Competition Alert</p>
                    <p className="text-xs text-gray-600">
                      3 Elite professionals are bidding. Highlight your tropical modern expertise.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Bidding Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Live Bidding Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>JL</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">Jason Lee</p>
                        <p className="text-xs text-gray-600">Bid RM 95,000</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">2 min ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>ST</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">Sarah Tan</p>
                        <p className="text-xs text-gray-600">Won project</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">5 min ago</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>RK</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">Raj Kumar</p>
                        <p className="text-xs text-gray-600">Instant hired</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">8 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Marketplace Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Win Rate</span>
                    <span className="font-semibold">
                      {userBids.length > 0 
                        ? `${Math.round((userBids.filter(b => b.status === 'accepted').length / userBids.length) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Bids</span>
                    <span className="font-semibold">{userBids.filter(b => b.status === 'pending').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Projects Won</span>
                    <span className="font-semibold">{userBids.filter(b => b.status === 'accepted').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Bids</span>
                    <span className="font-semibold">{userBids.length}</span>
                  </div>
                  <Button className="w-full mt-3" variant="outline">
                    Improve Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Custom Bid Modal */}
      {showBidModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Place Your Bid</h3>
            <p className="text-sm text-gray-600 mb-4">{selectedProject.title}</p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="bidAmount">Bid Amount (RM)</Label>
                <Input
                  id="bidAmount"
                  type="number"
                  placeholder="Enter your bid amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Budget: RM {selectedProject.budget.min.toLocaleString()} - {selectedProject.budget.max.toLocaleString()}
                </p>
              </div>
              
              <div>
                <Label htmlFor="bidMessage">Proposal Message</Label>
                <Textarea
                  id="bidMessage"
                  placeholder="Explain why you're the best fit for this project..."
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  className="flex-1"
                  onClick={handleCustomBid}
                >
                  Submit Bid
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBidModal(false);
                    setBidAmount('');
                    setBidMessage('');
                    setSelectedProject(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceLive;