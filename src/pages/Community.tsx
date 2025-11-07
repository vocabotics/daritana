import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommunityHub from '@/components/community/CommunityHub';
import { ConstructionReels } from '@/components/community/ConstructionReels';
import { ProjectPortfolio } from '@/components/community/ProjectPortfolio';
import { CommunityGroups } from '@/components/community/CommunityGroups';
import { IndustryFeed } from '@/components/community/IndustryFeed';
import { EducationalPlatform } from '@/components/community/EducationalPlatform';
import { 
  Play, 
  Image, 
  Users, 
  MessageSquare, 
  GraduationCap,
  TrendingUp
} from 'lucide-react';

export function Community() {
  const [activeTab, setActiveTab] = useState('hub');

  return (
    <Layout contextualInfo={false}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hub" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden md:inline">Hub</span>
          </TabsTrigger>
          <TabsTrigger value="reels" className="flex items-center gap-1">
            <Play className="h-4 w-4" />
            <span className="hidden md:inline">Reels</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-1">
            <Image className="h-4 w-4" />
            <span className="hidden md:inline">Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Groups</span>
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden md:inline">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="academy" className="flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden md:inline">Academy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hub" className="mt-6">
          <CommunityHub />
        </TabsContent>

        <TabsContent value="reels" className="mt-6">
          <ConstructionReels />
        </TabsContent>

        <TabsContent value="portfolio" className="mt-6">
          <ProjectPortfolio />
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <CommunityGroups />
        </TabsContent>

        <TabsContent value="feed" className="mt-6">
          <IndustryFeed />
        </TabsContent>

        <TabsContent value="academy" className="mt-6">
          <EducationalPlatform />
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

export default Community;