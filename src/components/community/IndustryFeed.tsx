import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { communityApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  Bookmark,
  TrendingUp,
  Hash,
  Image,
  Video,
  BarChart3,
  Calendar,
  MapPin,
  MoreHorizontal,
  Verified,
  AlertCircle,
  Zap,
  Mic,
  Users,
  Bell,
  Search,
  Filter,
  Globe,
  Clock,
  Building,
  DollarSign,
  Hammer,
  HardHat,
  Ruler,
  FileText,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Sparkles,
  Flame,
  Award,
  Link,
  Eye,
  Settings
} from 'lucide-react';

interface IndustryPost {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    profession: string;
    company?: string;
    followers: number;
  };
  content: {
    text: string;
    media?: {
      type: 'image' | 'video' | 'link';
      url: string;
      thumbnail?: string;
      title?: string;
      description?: string;
    }[];
    hashtags: string[];
    mentions: string[];
  };
  type: 'post' | 'thread' | 'news' | 'update' | 'question' | 'poll' | 'space';
  category: 'news' | 'regulation' | 'market' | 'project' | 'discussion' | 'announcement';
  engagement: {
    replies: number;
    reposts: number;
    likes: number;
    bookmarks: number;
    views: number;
  };
  metadata?: {
    location?: string;
    project?: string;
    priceChange?: number;
    sourceUrl?: string;
  };
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  postedAt: Date;
  trending: boolean;
  priority: 'normal' | 'breaking' | 'urgent';
}

interface TrendingTopic {
  id: string;
  hashtag: string;
  posts: number;
  change: number;
  category: string;
  description?: string;
}

interface IndustrySpace {
  id: string;
  title: string;
  host: string;
  speakers: string[];
  listeners: number;
  category: string;
  isLive: boolean;
  scheduledFor?: Date;
}

// Mock real-time industry posts
const mockPosts: IndustryPost[] = [
  {
    id: '1',
    author: {
      name: 'CIDB Malaysia',
      username: '@CIDBMalaysia',
      avatar: '',
      verified: true,
      profession: 'Official Authority',
      company: 'Construction Industry Development Board',
      followers: 125000
    },
    content: {
      text: '🚨 BREAKING: New UBBL amendments effective 1 Jan 2025. Key changes include mandatory BIM for projects >RM50M, enhanced sustainability requirements, and updated accessibility standards. Full guidelines available on our portal.',
      media: [
        {
          type: 'link',
          url: 'https://cidb.gov.my/ubbl-2025',
          thumbnail: '/images/ubbl-update.jpg',
          title: 'UBBL 2025 Amendments - Official Guidelines',
          description: 'Complete documentation of the new building by-laws'
        }
      ],
      hashtags: ['#UBBL2025', '#ConstructionRegulations', '#MalaysianConstruction'],
      mentions: []
    },
    type: 'news',
    category: 'regulation',
    engagement: {
      replies: 342,
      reposts: 1250,
      likes: 3420,
      bookmarks: 2150,
      views: 125000
    },
    metadata: {
      location: 'Malaysia'
    },
    isLiked: false,
    isReposted: false,
    isBookmarked: true,
    postedAt: new Date('2024-12-08T08:00:00'),
    trending: true,
    priority: 'breaking'
  },
  {
    id: '2',
    author: {
      name: 'Market Analytics MY',
      username: '@MarketAnalyticsMY',
      avatar: '',
      verified: true,
      profession: 'Market Research',
      company: 'Construction Analytics Sdn Bhd',
      followers: 45600
    },
    content: {
      text: '📊 Steel prices surge 15% this week! Rebar now at RM3,850/MT (↑RM502). Cement holding steady at RM420/MT. Sand prices vary by state - Selangor RM65/ton, Penang RM72/ton. Plan your procurement accordingly! 📈',
      media: [
        {
          type: 'image',
          url: '/images/price-chart.jpg'
        }
      ],
      hashtags: ['#ConstructionPrices', '#MaterialCosts', '#MarketUpdate'],
      mentions: []
    },
    type: 'update',
    category: 'market',
    engagement: {
      replies: 89,
      reposts: 234,
      likes: 567,
      bookmarks: 890,
      views: 34500
    },
    metadata: {
      priceChange: 15
    },
    isLiked: true,
    isReposted: false,
    isBookmarked: false,
    postedAt: new Date('2024-12-08T10:30:00'),
    trending: true,
    priority: 'urgent'
  },
  {
    id: '3',
    author: {
      name: 'Ahmad Rahman',
      username: '@ahmadarchitect',
      avatar: '',
      verified: true,
      profession: 'Principal Architect',
      company: 'AR Design Studio',
      followers: 15400
    },
    content: {
      text: 'Thread 🧵: Why Malaysian architecture needs to embrace our tropical climate instead of fighting it. Let me explain with examples from our latest passive cooling project in KL... (1/8)',
      media: [],
      hashtags: ['#TropicalArchitecture', '#SustainableDesign', '#PassiveCooling'],
      mentions: []
    },
    type: 'thread',
    category: 'discussion',
    engagement: {
      replies: 156,
      reposts: 89,
      likes: 1240,
      bookmarks: 456,
      views: 28900
    },
    isLiked: false,
    isReposted: false,
    isBookmarked: false,
    postedAt: new Date('2024-12-08T09:15:00'),
    trending: false,
    priority: 'normal'
  }
];

// Mock trending topics
const mockTrending: TrendingTopic[] = [
  {
    id: '1',
    hashtag: '#UBBL2025',
    posts: 3420,
    change: 156,
    category: 'Regulation',
    description: 'New building by-laws effective January 2025'
  },
  {
    id: '2',
    hashtag: '#SteelPrices',
    posts: 1890,
    change: 45,
    category: 'Market',
    description: 'Steel prices hit 6-month high'
  },
  {
    id: '3',
    hashtag: '#TRX106',
    posts: 1567,
    change: 89,
    category: 'Project',
    description: 'Malaysia\'s new tallest building tops out'
  },
  {
    id: '4',
    hashtag: '#GreenBuildingMY',
    posts: 892,
    change: 23,
    category: 'Sustainability'
  },
  {
    id: '5',
    hashtag: '#BIMAdoption',
    posts: 678,
    change: 12,
    category: 'Technology'
  }
];

// Mock live spaces
const mockSpaces: IndustrySpace[] = [
  {
    id: '1',
    title: 'UBBL 2025: What You Need to Know',
    host: 'CIDB Malaysia',
    speakers: ['Datuk Ahmad', 'Ir. Sarah Lim', 'Ar. Raj Kumar'],
    listeners: 1234,
    category: 'Regulation',
    isLive: true
  },
  {
    id: '2',
    title: 'Material Prices: Market Analysis & Forecast',
    host: 'Market Analytics MY',
    speakers: ['Dr. Chen Wei', 'En. Rosli'],
    listeners: 567,
    category: 'Market',
    isLive: true
  },
  {
    id: '3',
    title: 'Sustainable Design in Tropical Climate',
    host: 'Green Building Council',
    speakers: ['Ar. Michelle Tan'],
    listeners: 0,
    category: 'Sustainability',
    isLive: false,
    scheduledFor: new Date('2024-12-09T14:00:00')
  }
];

export function IndustryFeed() {
  const [posts, setPosts] = useState<IndustryPost[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [liveSpaces, setLiveSpaces] = useState<IndustrySpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [activeTab, setActiveTab] = useState('for-you');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // Load community data from APIs
  useEffect(() => {
    const loadCommunityData = async () => {
      setIsLoading(true);
      try {
        // Load posts
        const postsResponse = await communityApi.getPosts({ 
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          limit: 50 
        });
        if (postsResponse.data?.posts) {
          const formattedPosts = postsResponse.data.posts.map((post: any) => ({
            id: post.id,
            author: {
              name: post.author?.name || 'Unknown User',
              username: post.author?.username || post.author?.email || 'unknown',
              avatar: post.author?.avatar || '',
              verified: post.author?.verified || false,
              profession: post.author?.profession || post.author?.role || 'Professional',
              company: post.author?.company,
              followers: post.author?.followers || 0
            },
            content: {
              text: post.content || post.text || '',
              media: post.media || [],
              hashtags: post.hashtags || post.tags || [],
              mentions: post.mentions || []
            },
            type: post.type || 'post',
            category: post.category || 'discussion',
            engagement: {
              replies: post.comments || 0,
              reposts: post.reposts || 0,
              likes: post.likes || 0,
              bookmarks: post.bookmarks || 0,
              views: post.views || 0
            },
            metadata: post.metadata || {},
            isLiked: post.isLiked || false,
            isReposted: post.isReposted || false,
            isBookmarked: post.isBookmarked || false,
            postedAt: new Date(post.createdAt || post.postedAt),
            trending: post.trending || false,
            priority: post.priority || 'normal'
          }));
          setPosts(formattedPosts);
        }

        // Load trending topics (mock for now as API might not exist)
        setTrendingTopics(mockTrending);

        // Load live spaces (mock for now as API might not exist)
        setLiveSpaces(mockSpaces);
      } catch (error) {
        console.error('Failed to load community data:', error);
        toast.error('Failed to load community posts');
        // Fallback to mock data
        setPosts(mockPosts);
        setTrendingTopics(mockTrending);
        setLiveSpaces(mockSpaces);
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunityData();
  }, [selectedCategory]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'regulation': return <FileText className="h-4 w-4" />;
      case 'market': return <DollarSign className="h-4 w-4" />;
      case 'project': return <Building className="h-4 w-4" />;
      case 'news': return <Globe className="h-4 w-4" />;
      case 'discussion': return <MessageSquare className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              engagement: {
                ...post.engagement,
                likes: post.isLiked ? post.engagement.likes - 1 : post.engagement.likes + 1
              }
            }
          : post
      )
    );
  };

  const handleRepost = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isReposted: !post.isReposted,
              engagement: {
                ...post.engagement,
                reposts: post.isReposted ? post.engagement.reposts - 1 : post.engagement.reposts + 1
              }
            }
          : post
      )
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isBookmarked: !post.isBookmarked,
              engagement: {
                ...post.engagement,
                bookmarks: post.isBookmarked ? post.engagement.bookmarks - 1 : post.engagement.bookmarks + 1
              }
            }
          : post
      )
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Compose Box */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="What's happening in construction today?"
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      className="min-h-[60px] resize-none border-0 p-0 focus:ring-0"
                      onFocus={() => setIsComposing(true)}
                    />
                    
                    {isComposing && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-2 text-blue-500">
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">Everyone can reply</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost">
                              <Image className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Video className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {280 - newPostText.length}
                            </span>
                            <Button 
                              size="sm" 
                              disabled={newPostText.length === 0}
                              className="rounded-full"
                            >
                              Post
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Spaces Bar */}
          {mockSpaces.filter(s => s.isLive).length > 0 && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Mic className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Spaces</span>
                    </div>
                    <Badge className="bg-purple-600 text-white">
                      {mockSpaces.filter(s => s.isLive).length} LIVE
                    </Badge>
                  </div>
                  
                  <div className="flex -space-x-2">
                    {mockSpaces.filter(s => s.isLive).slice(0, 3).map((space) => (
                      <div 
                        key={space.id}
                        className="bg-white rounded-full p-2 border-2 border-purple-200 cursor-pointer hover:scale-110 transition-transform"
                        title={space.title}
                      >
                        <Users className="h-3 w-3 text-purple-600" />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-2 text-sm">
                  <div className="font-medium text-purple-900 truncate">
                    {mockSpaces.find(s => s.isLive)?.title}
                  </div>
                  <div className="text-purple-700">
                    {formatNumber(mockSpaces.find(s => s.isLive)?.listeners || 0)} listening
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="for-you">For You</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>

            <TabsContent value="for-you" className="space-y-4 mt-4">
              {posts.map((post) => (
                <Card key={post.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    {/* Priority Indicator */}
                    {post.priority === 'breaking' && (
                      <div className="flex items-center gap-2 mb-3 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-semibold">BREAKING NEWS</span>
                      </div>
                    )}
                    {post.priority === 'urgent' && (
                      <div className="flex items-center gap-2 mb-3 text-orange-600">
                        <Zap className="h-4 w-4" />
                        <span className="text-sm font-semibold">URGENT UPDATE</span>
                      </div>
                    )}

                    {/* Post Header */}
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{post.author.name}</span>
                              {post.author.verified && (
                                <Verified className="h-4 w-4 text-blue-500" />
                              )}
                              {post.trending && (
                                <Badge className="bg-orange-100 text-orange-700 text-xs">
                                  <Flame className="h-3 w-3 mr-1" />
                                  Trending
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              @{post.author.username} · {getTimeAgo(post.postedAt)}
                            </div>
                          </div>
                          
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Post Content */}
                        <div className="mt-3 space-y-3">
                          <p className="whitespace-pre-wrap">{post.content.text}</p>
                          
                          {/* Media */}
                          {post.content.media && post.content.media.length > 0 && (
                            <div className="space-y-2">
                              {post.content.media.map((media, idx) => (
                                <div key={idx}>
                                  {media.type === 'image' && (
                                    <img
                                      src={media.url}
                                      alt="Post media"
                                      className="rounded-lg max-h-96 w-full object-cover"
                                    />
                                  )}
                                  {media.type === 'link' && (
                                    <div className="border rounded-lg overflow-hidden hover:bg-gray-50 cursor-pointer">
                                      {media.thumbnail && (
                                        <img
                                          src={media.thumbnail}
                                          alt={media.title}
                                          className="w-full h-48 object-cover"
                                        />
                                      )}
                                      <div className="p-3">
                                        <div className="font-medium">{media.title}</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          {media.description}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                                          <Link className="h-3 w-3" />
                                          {new URL(media.url).hostname}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Metadata */}
                          {post.metadata && (
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {post.metadata.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {post.metadata.location}
                                </span>
                              )}
                              {post.metadata.priceChange && (
                                <span className={`flex items-center gap-1 font-medium ${
                                  post.metadata.priceChange > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  <TrendingUp className="h-3 w-3" />
                                  {post.metadata.priceChange > 0 ? '+' : ''}{post.metadata.priceChange}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Engagement Bar */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <button 
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                            onClick={() => {}}
                          >
                            <MessageCircle className="h-5 w-5" />
                            <span className="text-sm">{formatNumber(post.engagement.replies)}</span>
                          </button>
                          
                          <button 
                            className={`flex items-center gap-2 transition-colors ${
                              post.isReposted ? 'text-green-500' : 'text-gray-600 hover:text-green-500'
                            }`}
                            onClick={() => handleRepost(post.id)}
                          >
                            <Repeat2 className="h-5 w-5" />
                            <span className="text-sm">{formatNumber(post.engagement.reposts)}</span>
                          </button>
                          
                          <button 
                            className={`flex items-center gap-2 transition-colors ${
                              post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                            }`}
                            onClick={() => handleLike(post.id)}
                          >
                            <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{formatNumber(post.engagement.likes)}</span>
                          </button>
                          
                          <button 
                            className={`flex items-center gap-2 transition-colors ${
                              post.isBookmarked ? 'text-blue-500' : 'text-gray-600 hover:text-blue-500'
                            }`}
                            onClick={() => handleBookmark(post.id)}
                          >
                            <Bookmark className={`h-5 w-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                          </button>
                          
                          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                            <Share className="h-5 w-5" />
                          </button>
                        </div>

                        {/* View Count */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                          <Eye className="h-3 w-3" />
                          {formatNumber(post.engagement.views)} views
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="following" className="mt-4">
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Follow industry leaders</h3>
                <p>See posts from accounts you follow</p>
                <Button className="mt-4">Find People to Follow</Button>
              </div>
            </TabsContent>

            <TabsContent value="trending" className="mt-4">
              <div className="space-y-4">
                {posts.filter(p => p.trending).map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      {/* Same post structure as for-you tab */}
                      <div className="text-center py-8 text-gray-500">
                        Trending post content...
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Construction Feed"
                  className="pl-10 bg-gray-100 border-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Live Spaces */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mic className="h-5 w-5 text-purple-600" />
                  Spaces
                </h3>
                <Button size="sm" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {mockSpaces.map((space) => (
                  <div 
                    key={space.id}
                    className="p-3 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {space.isLive ? (
                            <Badge className="bg-red-500 text-white text-xs">LIVE</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {space.scheduledFor?.toLocaleTimeString('en-GB', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm mt-1">{space.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {space.host} · {space.speakers.length} speakers
                        </p>
                        {space.isLive && (
                          <p className="text-xs text-purple-600 font-medium mt-1">
                            {formatNumber(space.listeners)} listening
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                <Mic className="h-4 w-4 mr-2" />
                Create Space
              </Button>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Trending in Construction</h3>
              <div className="space-y-3">
                {mockTrending.map((topic, idx) => (
                  <div 
                    key={topic.id}
                    className="hover:bg-gray-50 -mx-2 px-2 py-2 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-gray-500">
                          {idx + 1} · {topic.category} · Trending
                        </div>
                        <div className="font-semibold text-sm mt-1">{topic.hashtag}</div>
                        {topic.description && (
                          <div className="text-xs text-gray-600 mt-1">{topic.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatNumber(topic.posts)} posts
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="link" className="w-full mt-2 text-blue-500">
                Show more
              </Button>
            </CardContent>
          </Card>

          {/* Who to Follow */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Who to follow</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>MB</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">MBAM</span>
                        <Verified className="h-3 w-3 text-blue-500" />
                      </div>
                      <span className="text-xs text-gray-600">@MBAMOfficial</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Follow</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>GBC</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">Green Building</span>
                        <Verified className="h-3 w-3 text-blue-500" />
                      </div>
                      <span className="text-xs text-gray-600">@GreenBuildMY</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Follow</Button>
                </div>
              </div>
              
              <Button variant="link" className="w-full mt-2 text-blue-500">
                Show more
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}