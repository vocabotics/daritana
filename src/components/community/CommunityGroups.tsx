import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { communityApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  MessageSquare, 
  Heart,
  Share,
  Bookmark,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  MapPin,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Settings,
  MoreHorizontal,
  Pin,
  Flag,
  Award,
  Zap,
  Bell,
  BellOff,
  Crown,
  Shield,
  Star,
  Clock,
  Camera,
  FileText,
  Link,
  Smile
} from 'lucide-react';

interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'regional' | 'cultural' | 'educational' | 'trade' | 'social';
  privacy: 'public' | 'private' | 'secret';
  coverImage: string;
  memberCount: number;
  postCount: number;
  growthRate: number;
  activityLevel: 'low' | 'medium' | 'high' | 'very_high';
  languages: string[];
  location?: string;
  rules: string[];
  admins: {
    id: string;
    name: string;
    avatar: string;
    role: 'admin' | 'moderator';
  }[];
  tags: string[];
  isJoined: boolean;
  isMember: boolean;
  joinDate?: Date;
  lastActivity: Date;
  featured: boolean;
  verified: boolean;
}

interface GroupPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: 'member' | 'admin' | 'moderator';
    profession?: string;
    verified: boolean;
  };
  content: {
    text: string;
    media?: {
      type: 'image' | 'video' | 'document';
      url: string;
      thumbnail?: string;
    }[];
    links?: {
      url: string;
      title: string;
      description: string;
      image?: string;
    }[];
  };
  type: 'text' | 'photo' | 'video' | 'link' | 'event' | 'poll' | 'question';
  groupId: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  isPinned: boolean;
  postedAt: Date;
  tags: string[];
}

// Mock community groups data
const mockGroups: CommunityGroup[] = [
  {
    id: '1',
    name: 'Malaysian Architects United',
    description: 'The largest community of architects in Malaysia. Share projects, discuss trends, and network with professionals nationwide.',
    category: 'professional',
    privacy: 'public',
    coverImage: '/images/groups/architects-cover.jpg',
    memberCount: 15420,
    postCount: 2340,
    growthRate: 18.5,
    activityLevel: 'very_high',
    languages: ['English', 'Malay'],
    location: 'Malaysia',
    rules: [
      'Be respectful to all members',
      'Share constructive content only',
      'No spam or self-promotion without permission',
      'Follow professional standards'
    ],
    admins: [
      {
        id: '1',
        name: 'Datuk Ahmad Rahman',
        avatar: '',
        role: 'admin'
      },
      {
        id: '2',
        name: 'Sarah Lim',
        avatar: '',
        role: 'moderator'
      }
    ],
    tags: ['Architecture', 'Malaysia', 'Professional', 'Networking'],
    isJoined: true,
    isMember: true,
    joinDate: new Date('2024-01-15'),
    lastActivity: new Date('2024-12-08'),
    featured: true,
    verified: true
  },
  {
    id: '2',
    name: 'Heritage Preservation Society',
    description: 'Dedicated to preserving Malaysia\'s architectural heritage. Discussion on conservation methods, heritage projects, and cultural significance.',
    category: 'cultural',
    privacy: 'public',
    coverImage: '/images/groups/heritage-cover.jpg',
    memberCount: 8920,
    postCount: 1560,
    growthRate: 22.3,
    activityLevel: 'high',
    languages: ['English', 'Malay', 'Chinese'],
    location: 'Malaysia',
    rules: [
      'Focus on heritage and conservation topics',
      'Share historical insights and documentation',
      'Respect cultural sensitivities',
      'Cite sources for historical claims'
    ],
    admins: [
      {
        id: '3',
        name: 'Prof. Dr. Lim Wei Ming',
        avatar: '',
        role: 'admin'
      }
    ],
    tags: ['Heritage', 'Conservation', 'Culture', 'History'],
    isJoined: false,
    isMember: false,
    lastActivity: new Date('2024-12-07'),
    featured: true,
    verified: true
  },
  {
    id: '3',
    name: 'Young Designers Network',
    description: 'A vibrant community for emerging architects and designers under 35. Share ideas, get mentorship, and collaborate on projects.',
    category: 'educational',
    privacy: 'public',
    coverImage: '/images/groups/young-designers-cover.jpg',
    memberCount: 12760,
    postCount: 3420,
    growthRate: 31.8,
    activityLevel: 'very_high',
    languages: ['English'],
    rules: [
      'Age limit: Under 35 years old',
      'Support and encourage fellow designers',
      'Share learning resources and opportunities',
      'Maintain a positive and collaborative environment'
    ],
    admins: [
      {
        id: '4',
        name: 'Michelle Tan',
        avatar: '',
        role: 'admin'
      },
      {
        id: '5',
        name: 'Raj Kumar',
        avatar: '',
        role: 'moderator'
      }
    ],
    tags: ['Young Professionals', 'Design', 'Mentorship', 'Collaboration'],
    isJoined: true,
    isMember: true,
    joinDate: new Date('2024-03-20'),
    lastActivity: new Date('2024-12-08'),
    featured: false,
    verified: false
  }
];

// Mock group posts
const mockPosts: GroupPost[] = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'Ahmad Rahman',
      avatar: '',
      role: 'admin',
      profession: 'Senior Architect',
      verified: true
    },
    content: {
      text: 'Exciting news! The new UBBL amendments for 2025 have been released. Key changes include updated accessibility requirements and new sustainability metrics. What are your thoughts on these changes?',
      media: [
        {
          type: 'document',
          url: '/documents/ubbl-2025-amendments.pdf',
          thumbnail: '/images/pdf-thumbnail.png'
        }
      ]
    },
    type: 'text',
    groupId: '1',
    engagement: {
      likes: 156,
      comments: 34,
      shares: 23
    },
    isLiked: false,
    isPinned: true,
    postedAt: new Date('2024-12-08T09:30:00'),
    tags: ['UBBL', 'Regulations', 'Sustainability']
  },
  {
    id: '2',
    author: {
      id: '6',
      name: 'Sarah Interior',
      avatar: '',
      role: 'member',
      profession: 'Interior Designer',
      verified: false
    },
    content: {
      text: 'Just completed this Peranakan shophouse restoration in George Town! The challenge was balancing heritage conservation with modern functionality. Swipe to see the before and after.',
      media: [
        {
          type: 'image',
          url: '/images/posts/shophouse-after.jpg'
        },
        {
          type: 'image',
          url: '/images/posts/shophouse-before.jpg'
        }
      ]
    },
    type: 'photo',
    groupId: '2',
    engagement: {
      likes: 289,
      comments: 67,
      shares: 45
    },
    isLiked: true,
    isPinned: false,
    postedAt: new Date('2024-12-07T16:45:00'),
    tags: ['Peranakan', 'Restoration', 'Heritage', 'Penang']
  }
];

const categoryColors = {
  professional: 'bg-blue-500',
  regional: 'bg-green-500',
  cultural: 'bg-purple-500',
  educational: 'bg-orange-500',
  trade: 'bg-gray-500',
  social: 'bg-pink-500'
};

const activityColors = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  very_high: 'text-red-500'
};

export function CommunityGroups() {
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('discover');
  const [newPostText, setNewPostText] = useState('');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleJoinGroup = (groupId: string) => {
    console.log('Joining group:', groupId);
  };

  const handleLeaveGroup = (groupId: string) => {
    console.log('Leaving group:', groupId);
  };

  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load community groups from API
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const response = await communityApi.getGroups({ 
          category: filterCategory !== 'all' ? filterCategory : undefined,
          search: searchQuery || undefined
        });
        if (response.data?.groups) {
          const formattedGroups = response.data.groups.map((group: any) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            category: group.category || 'professional',
            privacy: group.privacy || 'public',
            coverImage: group.coverImage || group.cover || '',
            memberCount: group.memberCount || group.members?.length || 0,
            postCount: group.postCount || group.posts?.length || 0,
            growthRate: group.growthRate || 0,
            activityLevel: group.activityLevel || 'medium',
            languages: group.languages || ['English'],
            location: group.location,
            rules: group.rules || [],
            admins: group.admins || [],
            tags: group.tags || [],
            isJoined: group.isJoined || false,
            isMember: group.isMember || false,
            joinDate: group.joinDate ? new Date(group.joinDate) : undefined,
            lastActivity: new Date(group.lastActivity || group.updatedAt || new Date()),
            featured: group.featured || false,
            verified: group.verified || false
          }));
          setGroups(formattedGroups);
        }
      } catch (error) {
        console.error('Failed to load community groups:', error);
        toast.error('Failed to load community groups');
        // Fallback to mock data
        setGroups(mockGroups);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [filterCategory, searchQuery]);

  const filteredGroups = groups.filter(group => {
    const matchesCategory = filterCategory === 'all' || group.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const myGroups = groups.filter(group => group.isMember);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Groups</h2>
          <p className="text-gray-600">Connect with professionals who share your interests</p>
        </div>
        <Button onClick={() => setShowCreateGroup(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={filterCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('all')}
              >
                All
              </Button>
              <Button
                variant={filterCategory === 'professional' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('professional')}
              >
                Professional
              </Button>
              <Button
                variant={filterCategory === 'cultural' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('cultural')}
              >
                Cultural
              </Button>
              <Button
                variant={filterCategory === 'educational' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory('educational')}
              >
                Educational
              </Button>
            </div>
          </div>

          {/* Featured Groups */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Featured Groups
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGroups.filter(group => group.featured).map((group) => (
                <Card 
                  key={group.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                  onClick={() => setSelectedGroup(group)}
                >
                  {/* Cover Image */}
                  <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                    <img
                      src={group.coverImage || '/api/placeholder/400/200'}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={`${categoryColors[group.category]} text-white`}>
                        {group.category}
                      </Badge>
                      {group.verified && (
                        <Badge className="bg-blue-500 text-white">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Privacy */}
                    <div className="absolute top-3 right-3">
                      {group.privacy === 'public' ? (
                        <Globe className="h-5 w-5 text-white" />
                      ) : group.privacy === 'private' ? (
                        <Lock className="h-5 w-5 text-white" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-white" />
                      )}
                    </div>

                    {/* Group Name */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg">{group.name}</h3>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {formatNumber(group.memberCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {formatNumber(group.postCount)} posts
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">+{group.growthRate}%</span>
                        </div>
                      </div>

                      {/* Activity Level */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Activity:</span>
                          <span className={`text-sm font-medium ${activityColors[group.activityLevel]}`}>
                            {group.activityLevel.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex gap-1">
                          {group.languages.map((lang, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full"
                        variant={group.isMember ? "outline" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (group.isMember) {
                            handleLeaveGroup(group.id);
                          } else {
                            handleJoinGroup(group.id);
                          }
                        }}
                      >
                        {group.isMember ? 'Joined' : 'Join Group'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* All Groups */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">All Groups</h3>
            <div className="space-y-4">
              {filteredGroups.filter(group => !group.featured).map((group) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Group Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={group.coverImage || '/api/placeholder/100/100'}
                            alt={group.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {group.privacy === 'private' && (
                          <div className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full p-1">
                            <Lock className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      {/* Group Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{group.name}</h3>
                              {group.verified && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">{group.description}</p>
                          </div>
                          
                          <Button 
                            size="sm"
                            variant={group.isMember ? "outline" : "default"}
                            onClick={() => {
                              if (group.isMember) {
                                handleLeaveGroup(group.id);
                              } else {
                                handleJoinGroup(group.id);
                              }
                            }}
                          >
                            {group.isMember ? 'Joined' : 'Join'}
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {formatNumber(group.memberCount)} members
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {formatNumber(group.postCount)} posts
                          </span>
                          <span className={`${activityColors[group.activityLevel]}`}>
                            {group.activityLevel.replace('_', ' ')} activity
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={`${categoryColors[group.category]} text-white text-xs`}>
                            {group.category}
                          </Badge>
                          {group.languages.map((lang, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <div 
                  className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600 cursor-pointer"
                  onClick={() => setSelectedGroup(group)}
                >
                  <img
                    src={group.coverImage || '/api/placeholder/400/200'}
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold">{group.name}</h3>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {formatNumber(group.memberCount)}
                      </span>
                      <span className="text-gray-500">
                        Joined {group.joinDate?.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => setSelectedGroup(group)}>
                        View Group
                      </Button>
                      <Button size="sm" variant="outline">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feed" className="space-y-6">
          {/* Create Post */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share something with your groups..."
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Camera className="h-4 w-4 mr-2" />
                        Photo/Video
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Document
                      </Button>
                      <Button size="sm" variant="outline">
                        <Link className="h-4 w-4 mr-2" />
                        Link
                      </Button>
                    </div>
                    <Button>Post</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div className="space-y-4">
            {mockPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author.avatar} />
                          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.author.name}</span>
                            {post.author.verified && (
                              <Shield className="h-4 w-4 text-blue-500" />
                            )}
                            {post.author.role === 'admin' && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                            {post.isPinned && (
                              <Pin className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {post.author.profession} • {post.postedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Post Content */}
                    <div className="space-y-3">
                      <p>{post.content.text}</p>
                      
                      {/* Media */}
                      {post.content.media && (
                        <div className="space-y-2">
                          {post.content.media.map((media, idx) => (
                            <div key={idx} className="relative">
                              {media.type === 'image' ? (
                                <img
                                  src={media.url}
                                  alt="Post media"
                                  className="w-full max-h-96 object-cover rounded-lg"
                                />
                              ) : media.type === 'video' ? (
                                <video
                                  src={media.url}
                                  poster={media.thumbnail}
                                  controls
                                  className="w-full max-h-96 rounded-lg"
                                />
                              ) : (
                                <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                                  <FileText className="h-8 w-8 text-gray-500" />
                                  <div>
                                    <div className="font-medium">Document</div>
                                    <div className="text-sm text-gray-600">PDF • Click to view</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Engagement */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-6">
                        <button
                          className="flex items-center gap-2 text-gray-600 hover:text-red-500"
                        >
                          <Heart className={`h-5 w-5 ${post.isLiked ? 'text-red-500 fill-current' : ''}`} />
                          <span>{post.engagement.likes}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
                          <MessageSquare className="h-5 w-5" />
                          <span>{post.engagement.comments}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-green-500">
                          <Share className="h-5 w-5" />
                          <span>{post.engagement.shares}</span>
                        </button>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events">
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Events Coming Soon</h3>
            <p>Group events and meetups will be available here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Group Detail Modal */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedGroup && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedGroup.name}</DialogTitle>
              </DialogHeader>

              {/* Group Header */}
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={selectedGroup.coverImage || '/api/placeholder/800/300'}
                  alt={selectedGroup.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {formatNumber(selectedGroup.memberCount)} members
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          +{selectedGroup.growthRate}% growth
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant={selectedGroup.isMember ? "secondary" : "default"}
                      onClick={() => {
                        if (selectedGroup.isMember) {
                          handleLeaveGroup(selectedGroup.id);
                        } else {
                          handleJoinGroup(selectedGroup.id);
                        }
                      }}
                    >
                      {selectedGroup.isMember ? 'Joined' : 'Join Group'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Group Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-gray-700">{selectedGroup.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Rules</h3>
                    <ul className="space-y-1 text-sm">
                      {selectedGroup.rules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-gray-500">{idx + 1}.</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Group Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Privacy:</span>
                        <div className="flex items-center gap-1">
                          {selectedGroup.privacy === 'public' ? (
                            <>
                              <Globe className="h-4 w-4" />
                              Public
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Private
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Category:</span>
                        <Badge className={`${categoryColors[selectedGroup.category]} text-white`}>
                          {selectedGroup.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Languages:</span>
                        <div className="flex gap-1">
                          {selectedGroup.languages.map((lang, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Activity:</span>
                        <span className={`font-medium ${activityColors[selectedGroup.activityLevel]}`}>
                          {selectedGroup.activityLevel.replace('_', ' ')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Admins & Moderators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedGroup.admins.map((admin) => (
                          <div key={admin.id} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={admin.avatar} />
                              <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium">{admin.name}</div>
                              <div className="text-sm text-gray-600 capitalize">{admin.role}</div>
                            </div>
                            {admin.role === 'admin' && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}