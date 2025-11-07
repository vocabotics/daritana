import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  Trophy, 
  BookOpen, 
  Calendar,
  TrendingUp,
  MessageSquare,
  Star,
  Globe,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CommunityHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');

  // Mock data for viral growth metrics
  const viralMetrics = {
    totalMembers: 15420,
    monthlyGrowth: 23.5,
    activeProjects: 342,
    networkValue: 2.8, // Million MYR
    viralCoefficient: 1.4,
    engagementRate: 68
  };

  // Mock trending professionals
  const trendingProfessionals = [
    {
      id: '1',
      name: 'Ahmad Razak',
      type: 'Architect',
      location: 'Kuala Lumpur',
      rating: 4.9,
      projects: 127,
      followers: 3420,
      badge: 'elite',
      speciality: 'Sustainable Design',
      culturalExpertise: ['Malay Traditional', 'Modern Tropical']
    },
    {
      id: '2',
      name: 'Michelle Tan',
      type: 'Interior Designer',
      location: 'Penang',
      rating: 4.8,
      projects: 89,
      followers: 2180,
      badge: 'verified',
      speciality: 'Peranakan Heritage',
      culturalExpertise: ['Peranakan', 'Contemporary Fusion']
    },
    {
      id: '3',
      name: 'Raj Kumar',
      type: 'Contractor',
      location: 'Johor Bahru',
      rating: 4.7,
      projects: 201,
      followers: 1590,
      badge: 'premium',
      speciality: 'Commercial Projects',
      culturalExpertise: ['Indian Traditional', 'Modern Commercial']
    }
  ];

  // Mock active challenges
  const activeDesignChallenges = [
    {
      id: '1',
      title: 'Sustainable Kampung House 2025',
      sponsor: 'Malaysian Green Building Council',
      prize: 50000,
      participants: 234,
      deadline: '2025-02-15',
      trending: true,
      viralScore: 89
    },
    {
      id: '2',
      title: 'Modern Kopitiam Redesign',
      sponsor: 'OldTown White Coffee',
      prize: 30000,
      participants: 156,
      deadline: '2025-01-30',
      trending: true,
      viralScore: 76
    }
  ];

  // Mock community groups
  const communityGroups = [
    {
      id: '1',
      name: 'KL Architecture Collective',
      members: 3420,
      type: 'regional',
      growthRate: 15.2,
      activityScore: 92,
      language: ['English', 'Malay']
    },
    {
      id: '2',
      name: 'Heritage Preservation Malaysia',
      members: 2180,
      type: 'cultural',
      growthRate: 22.7,
      activityScore: 88,
      language: ['English', 'Chinese', 'Malay']
    },
    {
      id: '3',
      name: 'Young Designers Network',
      members: 4560,
      type: 'professional',
      growthRate: 31.4,
      activityScore: 95,
      language: ['English']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Viral Growth Dashboard */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Community Hub</h1>
            <p className="text-gray-600 mt-2">Malaysia's Premier Design Ecosystem</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <Zap className="h-4 w-4 mr-2" />
              Start Viral Campaign
            </Button>
          </div>
        </div>

        {/* Viral Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Members</p>
                  <p className="text-2xl font-bold">{viralMetrics.totalMembers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
              <div className="mt-2">
                <span className="text-xs bg-blue-400 bg-opacity-30 px-2 py-1 rounded">
                  +{viralMetrics.monthlyGrowth}% this month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Projects</p>
                  <p className="text-2xl font-bold">{viralMetrics.activeProjects}</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-200" />
              </div>
              <div className="mt-2">
                <span className="text-xs bg-green-400 bg-opacity-30 px-2 py-1 rounded">
                  Live Bidding
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Network Value</p>
                  <p className="text-2xl font-bold">RM {viralMetrics.networkValue}M</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
              <div className="mt-2">
                <span className="text-xs bg-purple-400 bg-opacity-30 px-2 py-1 rounded">
                  Transaction Volume
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Viral Coefficient</p>
                  <p className="text-2xl font-bold">{viralMetrics.viralCoefficient}</p>
                </div>
                <Zap className="h-8 w-8 text-orange-200" />
              </div>
              <div className="mt-2">
                <Progress value={viralMetrics.viralCoefficient * 50} className="h-1 bg-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Engagement Rate</p>
                  <p className="text-2xl font-bold">{viralMetrics.engagementRate}%</p>
                </div>
                <MessageSquare className="h-8 w-8 text-pink-200" />
              </div>
              <div className="mt-2">
                <Progress value={viralMetrics.engagementRate} className="h-1 bg-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">Referral Rate</p>
                  <p className="text-2xl font-bold">3.2x</p>
                </div>
                <Target className="h-8 w-8 text-indigo-200" />
              </div>
              <div className="mt-2">
                <span className="text-xs bg-indigo-400 bg-opacity-30 px-2 py-1 rounded">
                  Viral Loop Active
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trending Professionals */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      Trending Professionals
                    </CardTitle>
                    <CardDescription>Top performers this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trendingProfessionals.map((professional) => (
                        <div key={professional.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={`/api/placeholder/100/100`} />
                              <AvatarFallback>{professional.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{professional.name}</h3>
                                {professional.badge === 'elite' && (
                                  <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                                    Elite
                                  </Badge>
                                )}
                                {professional.badge === 'verified' && (
                                  <Badge variant="secondary">Verified</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{professional.type} • {professional.location}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  <Star className="h-3 w-3 inline text-yellow-500" /> {professional.rating}
                                </span>
                                <span className="text-xs text-gray-500">{professional.projects} projects</span>
                                <span className="text-xs text-gray-500">{professional.followers} followers</span>
                              </div>
                              <div className="flex gap-2 mt-2">
                                {professional.culturalExpertise.map((expertise, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {expertise}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">View Profile</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Viral Actions */}
              <div className="space-y-6">
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Viral Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Invite Professionals (+500 points)
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Trophy className="h-4 w-4 mr-2" />
                      Create Challenge (+1000 points)
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Share Knowledge (+200 points)
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Award className="h-4 w-4 mr-2" />
                      Refer Client (+2000 points)
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Referral Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-100 p-3 rounded-lg text-center">
                      <p className="font-mono text-lg font-bold">DESIGN2025MY</p>
                      <p className="text-xs text-gray-600 mt-1">Share and earn RM50 per signup</p>
                    </div>
                    <Button className="w-full mt-3" variant="outline">
                      Copy & Share
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Project Marketplace</CardTitle>
                <CardDescription>Real-time bidding on active projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Marketplace component will be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeDesignChallenges.map((challenge) => (
                <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <CardDescription>{challenge.sponsor}</CardDescription>
                      </div>
                      {challenge.trending && (
                        <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white">
                          Trending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Prize Pool</span>
                        <span className="font-bold text-lg">RM {challenge.prize.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Participants</span>
                        <span className="font-semibold">{challenge.participants}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Deadline</span>
                        <span className="text-sm">{new Date(challenge.deadline).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Viral Score</span>
                          <span className="text-sm font-semibold">{challenge.viralScore}/100</span>
                        </div>
                        <Progress value={challenge.viralScore} className="h-2" />
                      </div>
                      <Button className="w-full">Join Challenge</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {communityGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{group.type}</Badge>
                      <Badge variant="outline" className="bg-green-50">
                        +{group.growthRate}% growth
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Members</span>
                        <span className="font-semibold">{group.members.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Activity Score</span>
                        <span className="font-semibold">{group.activityScore}/100</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {group.language.map((lang, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full" variant="outline">Join Group</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mentorship" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mentorship Programs</CardTitle>
                <CardDescription>Learn from industry experts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Mentorship component will be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityHub;