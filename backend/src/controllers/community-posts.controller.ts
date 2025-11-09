import { Request, Response } from 'express';
import { prisma } from '../server';
import { z } from 'zod';


// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  type: z.enum(['DISCUSSION', 'ARTICLE', 'QUESTION', 'ANNOUNCEMENT', 'SHOWCASE', 'EVENT', 'JOB', 'RESOURCE']).default('DISCUSSION'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  isPinned: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
});

const updatePostSchema = createPostSchema.partial().extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'HIDDEN', 'MODERATED']).optional(),
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

// Get community posts feed
export const getCommunityFeed = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { 
      page = 1, 
      limit = 10, 
      type = '', 
      category = '',
      tag = '',
      sortBy = 'publishedAt',
      sortOrder = 'desc',
      search = '',
      featured = false,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      OR: [
        { organizationId }, // Organization posts
        { organizationId: null }, // Public posts
      ],
      status: 'PUBLISHED',
      ...(type && { type }),
      ...(category && { category }),
      ...(tag && { tags: { has: String(tag) } }),
      ...(featured === true && { isFeatured: true }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [String(search)] } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              avatar: true,
              position: true,
            },
          },
          likes: {
            select: {
              userId: true,
            },
          },
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: {
                  name: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          shares: {
            select: {
              userId: true,
              platform: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              shares: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: [
          { isPinned: 'desc' },
          { [String(sortBy)]: sortOrder as 'asc' | 'desc' },
        ],
      }),
      prisma.communityPost.count({ where }),
    ]);

    // Add user interaction status
    const postsWithUserData = posts.map(post => ({
      ...post,
      isLikedByUser: post.likes.some(like => like.userId === req.user!.id),
      isSharedByUser: post.shares.some(share => share.userId === req.user!.id),
    }));

    res.json({
      posts: postsWithUserData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching community feed:', error);
    res.status(500).json({ error: 'Failed to fetch community feed' });
  }
};

// Get post by ID
export const getPostById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.user!;

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
            bio: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            likes: {
              select: {
                userId: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        likes: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        shares: {
          include: {
            user: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    await prisma.communityPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Check user interactions
    const isLikedByUser = post.likes.some(like => like.userId === userId);
    const isSharedByUser = post.shares.some(share => share.userId === userId);

    res.json({
      ...post,
      isLikedByUser,
      isSharedByUser,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// Create new post
export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: authorId, organizationId } = req.user!;
    const validatedData = createPostSchema.parse(req.body);

    const post = await prisma.communityPost.create({
      data: {
        ...validatedData,
        authorId,
        organizationId: validatedData.type === 'ANNOUNCEMENT' ? organizationId : null, // Public posts for most types
        publishedAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : new Date(),
        status: validatedData.scheduledAt ? 'DRAFT' : 'PUBLISHED',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification for organization if it's an announcement
    if (validatedData.type === 'ANNOUNCEMENT' && organizationId) {
      // Get organization members
      const members = await prisma.organizationMember.findMany({
        where: { organizationId, isActive: true },
        select: { userId: true },
      });

      // Create notifications for all members except author
      const notifications = members
        .filter(member => member.userId !== authorId)
        .map(member => ({
          organizationId,
          recipientId: member.userId,
          title: 'New Announcement',
          message: validatedData.title,
          type: 'INFO' as const,
          resourceType: 'community_post',
          resourceId: post.id,
        }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications,
        });
      }
    }

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

// Update post
export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user!;
    const validatedData = updatePostSchema.parse(req.body);

    // Check if user owns the post
    const existingPost = await prisma.communityPost.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost || existingPost.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const updates: any = { ...validatedData };
    if (validatedData.scheduledAt) {
      updates.scheduledAt = new Date(validatedData.scheduledAt);
    }

    const post = await prisma.communityPost.update({
      where: { id },
      data: updates,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

// Delete post
export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user!;

    // Check if user owns the post
    const post = await prisma.communityPost.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post || post.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await prisma.communityPost.delete({
      where: { id },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// Like/unlike post
export const toggleLike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user!;

    // Check if already liked
    const existingLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.communityLike.delete({
        where: { id: existingLike.id },
      });
      
      // Decrement like count
      await prisma.communityPost.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      });

      res.json({ liked: false, message: 'Post unliked' });
    } else {
      // Like
      await prisma.communityLike.create({
        data: {
          postId: id,
          userId,
        },
      });

      // Increment like count
      await prisma.communityPost.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      });

      res.json({ liked: true, message: 'Post liked' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// Add comment to post
export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { id: authorId } = req.user!;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId: id,
        authorId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Increment comment count
    await prisma.communityPost.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Share post
export const sharePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user!;
    const { message, platform = 'internal' } = req.body;

    const share = await prisma.communityShare.create({
      data: {
        postId: id,
        userId,
        message,
        platform,
      },
    });

    // Increment share count
    await prisma.communityPost.update({
      where: { id },
      data: { shareCount: { increment: 1 } },
    });

    res.status(201).json(share);
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ error: 'Failed to share post' });
  }
};

// Get trending posts
export const getTrendingPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = '7' } = req.query; // days
    
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - Number(period));

    const posts = await prisma.communityPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: periodStart },
      },
      include: {
        author: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            shares: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { likeCount: 'desc' },
        { commentCount: 'desc' },
      ],
      take: 20,
    });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    res.status(500).json({ error: 'Failed to fetch trending posts' });
  }
};