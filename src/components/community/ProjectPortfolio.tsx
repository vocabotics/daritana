import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  Camera,
  Grid,
  List,
  MapPin,
  Calendar,
  Eye,
  DollarSign,
  Award,
  Users,
  Verified,
  Plus,
  Settings,
  MoreHorizontal,
  Play,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';

interface ProjectPost {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    profession: string;
    location: string;
    followers: number;
  };
  project: {
    title: string;
    category: 'residential' | 'commercial' | 'industrial' | 'heritage' | 'landscape';
    type: 'before_after' | 'gallery' | 'video' | 'story' | 'reel';
    location: string;
    budget?: number;
    duration: string;
    completionDate: Date;
    client?: string;
    description: string;
    tags: string[];
    culturalElements?: string[];
  };
  media: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    aspectRatio: 'square' | 'portrait' | 'landscape';
    order: number;
  }[];
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    views: number;
  };
  isLiked: boolean;
  isSaved: boolean;
  postedAt: Date;
  featured: boolean;
  awards?: string[];
}

// Mock project portfolio data
const mockProjects: ProjectPost[] = [
  {
    id: '1',
    user: {
      name: 'Ahmad Razak',
      username: '@ahmadarchitect',
      avatar: '',
      verified: true,
      profession: 'Principal Architect',
      location: 'Kuala Lumpur',
      followers: 15400
    },
    project: {
      title: 'Modern Tropical Villa with Heritage Elements',
      category: 'residential',
      type: 'gallery',
      location: 'Bangsar, Kuala Lumpur',
      budget: 2800000,
      duration: '18 months',
      completionDate: new Date('2024-11-15'),
      client: 'Private Residence',
      description: 'A contemporary interpretation of traditional Malay architecture with modern sustainable features. This project seamlessly blends cultural heritage with contemporary living.',
      tags: ['#ModernTropical', '#SustainableDesign', '#MalayHeritage', '#LuxuryHomes'],
      culturalElements: ['Traditional Ventilation', 'Malay Motifs', 'Tropical Materials']
    },
    media: [
      {
        type: 'image',
        url: '/images/portfolio/villa-1.jpg',
        aspectRatio: 'landscape',
        order: 1
      },
      {
        type: 'image',
        url: '/images/portfolio/villa-2.jpg',
        aspectRatio: 'square',
        order: 2
      },
      {
        type: 'image',
        url: '/images/portfolio/villa-3.jpg',
        aspectRatio: 'portrait',
        order: 3
      }
    ],
    engagement: {
      likes: 8420,
      comments: 156,
      shares: 89,
      saves: 342,
      views: 25600
    },
    isLiked: false,
    isSaved: true,
    postedAt: new Date('2024-11-20'),
    featured: true,
    awards: ['Best Residential Design 2024', 'Sustainability Excellence']
  },
  {
    id: '2',
    user: {
      name: 'Sarah Interior Studio',
      username: '@sarahinteriors',
      avatar: '',
      verified: true,
      profession: 'Interior Design Studio',
      location: 'Penang',
      followers: 22100
    },
    project: {
      title: 'Heritage Shophouse Transformation',
      category: 'heritage',
      type: 'before_after',
      location: 'George Town, Penang',
      budget: 850000,
      duration: '8 months',
      completionDate: new Date('2024-10-08'),
      client: 'Boutique Hotel',
      description: 'Restoring a 1920s Peranakan shophouse while preserving its cultural significance and adding modern amenities for hospitality use.',
      tags: ['#HeritageRestoration', '#PeranakanDesign', '#BoutiqueHotel', '#CulturalPreservation'],
      culturalElements: ['Peranakan Tiles', 'Traditional Joinery', 'Heritage Colors']
    },
    media: [
      {
        type: 'image',
        url: '/images/portfolio/shophouse-before.jpg',
        aspectRatio: 'landscape',
        order: 1
      },
      {
        type: 'image',
        url: '/images/portfolio/shophouse-after.jpg',
        aspectRatio: 'landscape',
        order: 2
      }
    ],
    engagement: {
      likes: 12700,
      comments: 298,
      shares: 156,
      saves: 678,
      views: 45200
    },
    isLiked: true,
    isSaved: false,
    postedAt: new Date('2024-11-18'),
    featured: true,
    awards: ['Heritage Preservation Award 2024']
  }
];

const categoryColors = {
  residential: 'bg-green-500',
  commercial: 'bg-blue-500',
  industrial: 'bg-gray-500',
  heritage: 'bg-purple-500',
  landscape: 'bg-emerald-500'
};

export function ProjectPortfolio() {
  const [selectedPost, setSelectedPost] = useState<ProjectPost | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleLike = (postId: string) => {
    console.log('Liked post:', postId);
  };

  const handleSave = (postId: string) => {
    console.log('Saved post:', postId);
  };

  const handleShare = (postId: string) => {
    console.log('Shared post:', postId);
  };

  const nextMedia = () => {
    if (selectedPost && currentMediaIndex < selectedPost.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  const filteredProjects = mockProjects.filter(project => {
    const matchesCategory = filterCategory === 'all' || project.project.category === filterCategory;
    const matchesSearch = searchQuery === '' || 
      project.project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Portfolio</h2>
          <p className="text-gray-600">Discover inspiring construction and design projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Share Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects, tags, or descriptions..."
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
            variant={filterCategory === 'residential' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('residential')}
          >
            Residential
          </Button>
          <Button
            variant={filterCategory === 'commercial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('commercial')}
          >
            Commercial
          </Button>
          <Button
            variant={filterCategory === 'heritage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory('heritage')}
          >
            Heritage
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => {
                setSelectedPost(project);
                setCurrentMediaIndex(0);
              }}
            >
              {/* Project Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={project.media[0]?.url || '/api/placeholder/400/400'}
                  alt={project.project.title}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
                
                {/* Overlay badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className={`${categoryColors[project.project.category]} text-white`}>
                    {project.project.category}
                  </Badge>
                  {project.featured && (
                    <Badge className="bg-yellow-500 text-white">
                      <Award className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Media count */}
                {project.media.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                    1/{project.media.length}
                  </div>
                )}

                {/* Engagement overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <div className="flex items-center justify-between text-white text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {formatNumber(project.engagement.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {formatNumber(project.engagement.comments)}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatNumber(project.engagement.views)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2">{project.project.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3" />
                      {project.project.location}
                      {project.project.budget && (
                        <>
                          <span>•</span>
                          <span>{formatCurrency(project.project.budget)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.user.avatar} />
                      <AvatarFallback>{project.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{project.user.name}</span>
                    {project.user.verified && (
                      <Verified className="h-4 w-4 text-blue-500" />
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {project.project.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {project.project.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.project.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {/* Project Image */}
                  <div 
                    className="relative w-48 h-32 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                    onClick={() => {
                      setSelectedPost(project);
                      setCurrentMediaIndex(0);
                    }}
                  >
                    <img
                      src={project.media[0]?.url || '/api/placeholder/300/200'}
                      alt={project.project.title}
                      className="w-full h-full object-cover"
                    />
                    {project.media.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        1/{project.media.length}
                      </div>
                    )}
                  </div>

                  {/* Project Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-xl">{project.project.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={`${categoryColors[project.project.category]} text-white`}>
                            {project.project.category}
                          </Badge>
                          {project.featured && (
                            <Badge className="bg-yellow-500 text-white">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {project.project.location}
                        </div>
                        {project.project.budget && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(project.project.budget)}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {project.project.duration}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700 line-clamp-2">{project.project.description}</p>

                    {/* User & Engagement */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={project.user.avatar} />
                          <AvatarFallback>{project.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{project.user.name}</span>
                            {project.user.verified && (
                              <Verified className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <span className="text-sm text-gray-600">{project.user.profession}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {formatNumber(project.engagement.likes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {formatNumber(project.engagement.comments)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {formatNumber(project.engagement.views)}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {project.project.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <div className="space-y-6">
              {/* Header */}
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedPost.project.title}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Media Gallery */}
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {selectedPost.media[currentMediaIndex]?.type === 'image' ? (
                      <img
                        src={selectedPost.media[currentMediaIndex]?.url}
                        alt={selectedPost.project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={selectedPost.media[currentMediaIndex]?.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}

                    {/* Navigation arrows */}
                    {selectedPost.media.length > 1 && (
                      <>
                        <button
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                          onClick={prevMedia}
                          disabled={currentMediaIndex === 0}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                          onClick={nextMedia}
                          disabled={currentMediaIndex === selectedPost.media.length - 1}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Media counter */}
                    {selectedPost.media.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {currentMediaIndex + 1} / {selectedPost.media.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  {selectedPost.media.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedPost.media.map((media, index) => (
                        <button
                          key={index}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                            index === currentMediaIndex ? 'border-blue-500' : 'border-gray-200'
                          }`}
                          onClick={() => setCurrentMediaIndex(index)}
                        >
                          <img
                            src={media.url}
                            alt={`Media ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Project Details */}
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedPost.user.avatar} />
                        <AvatarFallback>{selectedPost.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{selectedPost.user.name}</span>
                          {selectedPost.user.verified && (
                            <Verified className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedPost.user.profession} • {formatNumber(selectedPost.user.followers)} followers
                        </div>
                      </div>
                    </div>
                    <Button>Follow</Button>
                  </div>

                  {/* Project Info */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <div className="mt-1">
                          <Badge className={`${categoryColors[selectedPost.project.category]} text-white`}>
                            {selectedPost.project.category}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <div className="mt-1 font-medium">{selectedPost.project.location}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <div className="mt-1 font-medium">{selectedPost.project.duration}</div>
                      </div>
                      {selectedPost.project.budget && (
                        <div>
                          <span className="text-gray-600">Budget:</span>
                          <div className="mt-1 font-medium">{formatCurrency(selectedPost.project.budget)}</div>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-600">Description:</span>
                      <p className="mt-1">{selectedPost.project.description}</p>
                    </div>

                    {selectedPost.project.culturalElements && (
                      <div>
                        <span className="text-gray-600">Cultural Elements:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedPost.project.culturalElements.map((element, idx) => (
                            <Badge key={idx} variant="outline">
                              {element}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPost.awards && (
                      <div>
                        <span className="text-gray-600">Awards:</span>
                        <div className="mt-1 space-y-1">
                          {selectedPost.awards.map((award, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{award}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {selectedPost.project.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Engagement Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-6">
                      <button
                        className="flex items-center gap-2 text-gray-600 hover:text-red-500"
                        onClick={() => handleLike(selectedPost.id)}
                      >
                        <Heart 
                          className={`h-6 w-6 ${selectedPost.isLiked ? 'text-red-500 fill-current' : ''}`} 
                        />
                        <span>{formatNumber(selectedPost.engagement.likes)}</span>
                      </button>
                      
                      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
                        <MessageCircle className="h-6 w-6" />
                        <span>{formatNumber(selectedPost.engagement.comments)}</span>
                      </button>
                      
                      <button
                        className="flex items-center gap-2 text-gray-600 hover:text-green-500"
                        onClick={() => handleShare(selectedPost.id)}
                      >
                        <Share className="h-6 w-6" />
                        <span>{formatNumber(selectedPost.engagement.shares)}</span>
                      </button>
                    </div>

                    <button
                      className="text-gray-600 hover:text-yellow-500"
                      onClick={() => handleSave(selectedPost.id)}
                    >
                      <Bookmark 
                        className={`h-6 w-6 ${selectedPost.isSaved ? 'text-yellow-500 fill-current' : ''}`} 
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}