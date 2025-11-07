import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CommunityEmptyState } from '@/components/ui/empty-state';
import { useCommunityStore } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';
import { useDemoStore } from '@/store/demoStore';
import { toast } from 'sonner';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreVertical,
  Verified,
  Timer,
  MapPin,
  Eye,
  TrendingUp,
  Zap,
  Award,
  Users,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface ConstructionReel {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    badges: string[];
    profession: string;
    location: string;
  };
  video: {
    url: string;
    thumbnail: string;
    duration: number;
    quality: '720p' | '1080p' | '4K';
  };
  content: {
    caption: string;
    hashtags: string[];
    category: 'progress' | 'tutorial' | 'tips' | 'showcase' | 'safety' | 'tools';
    projectType?: string;
    location?: string;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    views: number;
  };
  timeAgo: string;
  isLiked: boolean;
  isSaved: boolean;
  trending: boolean;
}

// Mock data for construction reels
const mockReels: ConstructionReel[] = [
  {
    id: '1',
    user: {
      name: 'Ahmad Contractor',
      username: '@ahmadbuilds',
      avatar: '',
      verified: true,
      badges: ['Pro Builder', 'Safety Expert'],
      profession: 'Senior Contractor',
      location: 'Kuala Lumpur'
    },
    video: {
      url: '/videos/construction-timelapse.mp4',
      thumbnail: '/images/construction-thumb1.jpg',
      duration: 45,
      quality: '1080p'
    },
    content: {
      caption: 'Foundation to roof in 45 seconds! 6-month condo project in KLCC 🏗️',
      hashtags: ['#MalaysianConstruction', '#KLCC', '#Timelapse', '#CondoLife'],
      category: 'progress',
      projectType: 'Residential High-Rise',
      location: 'KLCC, Kuala Lumpur'
    },
    engagement: {
      likes: 15420,
      comments: 234,
      shares: 89,
      saves: 456,
      views: 87500
    },
    timeAgo: '2h',
    isLiked: false,
    isSaved: false,
    trending: true
  },
  {
    id: '2',
    user: {
      name: 'Sarah Interior Pro',
      username: '@sarahdesigns',
      avatar: '',
      verified: true,
      badges: ['Cultural Expert', 'Sustainability Pro'],
      profession: 'Interior Designer',
      location: 'Penang'
    },
    video: {
      url: '/videos/peranakan-design.mp4',
      thumbnail: '/images/peranakan-thumb.jpg',
      duration: 30,
      quality: '4K'
    },
    content: {
      caption: 'Transforming a heritage shophouse with modern Peranakan elements ✨',
      hashtags: ['#PeranakanHeritage', '#ShophouseDesign', '#PenangHeritage'],
      category: 'showcase',
      projectType: 'Heritage Restoration',
      location: 'George Town, Penang'
    },
    engagement: {
      likes: 8920,
      comments: 156,
      shares: 67,
      saves: 892,
      views: 45300
    },
    timeAgo: '4h',
    isLiked: true,
    isSaved: true,
    trending: false
  },
  {
    id: '3',
    user: {
      name: 'Raj Tools Master',
      username: '@rajtoolsmy',
      avatar: '',
      verified: false,
      badges: ['Tool Expert'],
      profession: 'Tool Specialist',
      location: 'Shah Alam'
    },
    video: {
      url: '/videos/tool-demo.mp4',
      thumbnail: '/images/tools-thumb.jpg',
      duration: 60,
      quality: '720p'
    },
    content: {
      caption: 'This one tool will change how you measure angles! 📐 Game changer for precision work',
      hashtags: ['#ConstructionTools', '#PrecisionWork', '#ToolReview'],
      category: 'tools',
      projectType: 'Tool Review'
    },
    engagement: {
      likes: 3450,
      comments: 89,
      shares: 234,
      saves: 123,
      views: 12800
    },
    timeAgo: '6h',
    isLiked: false,
    isSaved: false,
    trending: false
  }
];

interface ConstructionReelsProps {
  onReelChange?: (reelId: string) => void;
}

export function ConstructionReels({ onReelChange }: ConstructionReelsProps) {
  const { user } = useAuthStore();
  const { reels, likeReel, unlikeReel, shareReel, saveReel, unsaveReel, addReelComment, currentUserId } = useCommunityStore();
  const { isEnabled: isDemoMode } = useDemoStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Show empty state when no reels in real mode
  const shouldShowEmptyState = reels.length === 0 && !isDemoMode;
  
  // Use store reels if available, otherwise use mock data in demo mode
  const displayReels = isDemoMode ? mockReels : reels.map(reel => ({
    ...mockReels[0],
    id: reel.id,
    content: {
      caption: reel.description,
      hashtags: ['#Construction', '#Malaysia'],
      category: 'showcase' as const,
      projectType: 'Construction',
      location: 'Malaysia'
    },
    engagement: {
      likes: reel.likes,
      comments: reel.comments.length,
      shares: reel.shares,
      saves: reel.savedBy.length,
      views: reel.views
    },
    isLiked: reel.likedBy.includes(currentUserId),
    isSaved: reel.savedBy.includes(currentUserId),
    video: {
      ...mockReels[0].video,
      thumbnail: reel.thumbnail
    }
  }));

  // Handle video playback
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex && isPlaying) {
          video.play();
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, isPlaying]);

  const handleLike = (reelId: string) => {
    const reel = reels.find(r => r.id === reelId);
    if (reel) {
      if (reel.likedBy.includes(currentUserId)) {
        unlikeReel(reelId, currentUserId);
        toast.success('Removed from likes');
      } else {
        likeReel(reelId, currentUserId);
        toast.success('Added to likes');
      }
    }
  };

  const handleShare = (reelId: string) => {
    shareReel(reelId);
    // Copy link to clipboard
    navigator.clipboard.writeText(`${window.location.origin}/reel/${reelId}`);
    toast.success('Link copied to clipboard!');
  };

  const handleSave = (reelId: string) => {
    const reel = reels.find(r => r.id === reelId);
    if (reel) {
      if (reel.savedBy.includes(currentUserId)) {
        unsaveReel(reelId, currentUserId);
        toast.success('Removed from saved');
      } else {
        saveReel(reelId, currentUserId);
        toast.success('Added to saved items');
      }
    }
  };
  
  const handleAddComment = (reelId: string) => {
    if (commentText.trim()) {
      addReelComment(reelId, {
        userId: currentUserId,
        userName: user?.firstName + ' ' + user?.lastName || 'Anonymous',
        userAvatar: user?.avatar,
        content: commentText
      });
      setCommentText('');
      toast.success('Comment added');
    }
  };

  const navigateReel = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'down' && currentIndex < displayReels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'progress': return <Timer className="h-4 w-4" />;
      case 'tutorial': return <Play className="h-4 w-4" />;
      case 'tips': return <Zap className="h-4 w-4" />;
      case 'showcase': return <Award className="h-4 w-4" />;
      case 'tools': return <Eye className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'progress': return 'bg-blue-500';
      case 'tutorial': return 'bg-green-500';
      case 'tips': return 'bg-yellow-500';
      case 'showcase': return 'bg-purple-500';
      case 'tools': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (shouldShowEmptyState) {
    return (
      <div className="flex items-center justify-center py-20">
        <CommunityEmptyState onJoinCommunity={() => {}} />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden">
      {/* Navigation Arrows */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="bg-black/50 text-white hover:bg-black/70"
          onClick={() => navigateReel('up')}
          disabled={currentIndex === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="bg-black/50 text-white hover:bg-black/70"
          onClick={() => navigateReel('down')}
          disabled={currentIndex === displayReels.length - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Reels Container */}
      <div 
        ref={containerRef}
        className="relative h-[600px] overflow-hidden"
        style={{ 
          transform: `translateY(-${currentIndex * 600}px)`,
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {displayReels.map((reel, index) => (
          <div key={reel.id} className="relative h-[600px] w-full">
            {/* Video */}
            <video
              ref={(el) => videoRefs.current[index] = el}
              className="w-full h-full object-cover"
              src={reel.video.url}
              poster={reel.video.thumbnail}
              loop
              muted={isMuted}
              playsInline
              onClick={() => setIsPlaying(!isPlaying)}
            />

            {/* Video Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Top UI */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Badge className={`${getCategoryColor(reel.content.category)} text-white`}>
                  {getCategoryIcon(reel.content.category)}
                  <span className="ml-1 capitalize">{reel.content.category}</span>
                </Badge>
                {reel.trending && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white bg-black/50 hover:bg-black/70"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white bg-black/50 hover:bg-black/70"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={reel.user.avatar} />
                  <AvatarFallback className="bg-gray-600 text-white">
                    {reel.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{reel.user.username}</span>
                    {reel.user.verified && <Verified className="h-4 w-4 text-blue-400" />}
                    <span className="text-sm text-gray-300">• {reel.timeAgo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span>{reel.user.profession}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {reel.user.location}
                    </div>
                  </div>
                </div>
                <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                  Follow
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <p className="text-sm">{reel.content.caption}</p>
                <div className="flex flex-wrap gap-1">
                  {reel.content.hashtags.map((hashtag, idx) => (
                    <span key={idx} className="text-sm text-blue-300">
                      {hashtag}
                    </span>
                  ))}
                </div>
                {reel.content.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-300">
                    <MapPin className="h-3 w-3" />
                    {reel.content.location}
                  </div>
                )}
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-300">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatNumber(reel.engagement.views)}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {formatNumber(reel.engagement.likes)} likes
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-4 z-10">
              <button
                className="flex flex-col items-center gap-1"
                onClick={() => handleLike(reel.id)}
              >
                <div className={`p-2 rounded-full ${reel.isLiked ? 'bg-red-500' : 'bg-black/50'}`}>
                  <Heart 
                    className={`h-6 w-6 ${reel.isLiked ? 'text-white fill-current' : 'text-white'}`} 
                  />
                </div>
                <span className="text-xs text-white">{formatNumber(reel.engagement.likes)}</span>
              </button>

              <button
                className="flex flex-col items-center gap-1"
                onClick={() => setShowComments(!showComments)}
              >
                <div className="p-2 rounded-full bg-black/50">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-white">{formatNumber(reel.engagement.comments)}</span>
              </button>

              <button
                className="flex flex-col items-center gap-1"
                onClick={() => handleShare(reel.id)}
              >
                <div className="p-2 rounded-full bg-black/50">
                  <Share className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-white">{formatNumber(reel.engagement.shares)}</span>
              </button>

              <button
                className="flex flex-col items-center gap-1"
                onClick={() => handleSave(reel.id)}
              >
                <div className={`p-2 rounded-full ${reel.isSaved ? 'bg-yellow-500' : 'bg-black/50'}`}>
                  <Bookmark 
                    className={`h-6 w-6 ${reel.isSaved ? 'text-white fill-current' : 'text-white'}`} 
                  />
                </div>
                <span className="text-xs text-white">{formatNumber(reel.engagement.saves)}</span>
              </button>
            </div>

            {/* Play/Pause Indicator */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-black/70 rounded-full p-4">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comments Overlay */}
      {showComments && displayReels[currentIndex] && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-end">
          <div className="w-full bg-gray-900 rounded-t-3xl p-4 max-h-[70%] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Comments ({displayReels[currentIndex].engagement.comments})</h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-white"
                onClick={() => setShowComments(false)}
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Input 
                  placeholder="Add a comment..." 
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddComment(displayReels[currentIndex].id);
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => handleAddComment(displayReels[currentIndex].id)}
                >
                  Post
                </Button>
              </div>
              
              {/* Display real comments */}
              {reels.find(r => r.id === displayReels[currentIndex].id)?.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{comment.userName}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(comment.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
              
              {reels.find(r => r.id === displayReels[currentIndex].id)?.comments.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                  Be the first to comment!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}