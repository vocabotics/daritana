import { Request, Response } from 'express'
import { prisma } from '../server'
import { z } from 'zod'


// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  type: z.enum(['DISCUSSION', 'ARTICLE', 'QUESTION', 'ANNOUNCEMENT', 'SHOWCASE', 'EVENT', 'JOB', 'RESOURCE']),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
})

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'SECRET']),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  banner: z.string().optional(),
  avatar: z.string().optional(),
})

const createChallengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  type: z.enum(['DESIGN', 'TECHNICAL', 'CREATIVE', 'BUSINESS', 'MIXED']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  banner: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  rules: z.string().optional(),
  prizes: z.any().optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  maxParticipants: z.number().optional(),
})

// Helper to get user from request
const getUserFromRequest = (req: any) => {
  return req.user // Assumes authentication middleware sets req.user
}

// ==================== POSTS ====================

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, category, organizationId } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {
      status: 'PUBLISHED',
      deletedAt: null,
    }

    if (type) where.type = type
    if (category) where.category = category
    if (organizationId) where.organizationId = organizationId

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              shares: true,
            }
          }
        },
        orderBy: [
          { isPinned: 'desc' },
          { isFeatured: 'desc' },
          { publishedAt: 'desc' }
        ]
      }),
      prisma.communityPost.count({ where })
    ])

    // Increment view count for posts
    const postIds = posts.map(p => p.id)
    await prisma.communityPost.updateMany({
      where: { id: { in: postIds } },
      data: { viewCount: { increment: 1 } }
    })

    res.json({
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get posts error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    })
  }
}

export const getPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              }
            },
            likes: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        shares: true,
      }
    })

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    // Increment view count
    await prisma.communityPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    })

    res.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('Get post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    })
  }
}

export const createPost = async (req: any, res: Response) => {
  try {
    const user = getUserFromRequest(req)
    const validatedData = createPostSchema.parse(req.body)

    const post = await prisma.communityPost.create({
      data: {
        ...validatedData,
        authorId: user.id,
        organizationId: user.organizationId,
        status: validatedData.status || 'PUBLISHED',
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: post
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    })
  }
}

export const updatePost = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)
    const updates = req.body

    // Check if user owns the post
    const existingPost = await prisma.communityPost.findUnique({
      where: { id }
    })

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    if (existingPost.authorId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this post'
      })
    }

    const post = await prisma.communityPost.update({
      where: { id },
      data: updates,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    })

    res.json({
      success: true,
      data: post
    })
  } catch (error) {
    console.error('Update post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    })
  }
}

export const deletePost = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)

    // Check if user owns the post
    const post = await prisma.communityPost.findUnique({
      where: { id }
    })

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    if (post.authorId !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this post'
      })
    }

    // Soft delete
    await prisma.communityPost.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    })
  }
}

// ==================== POST INTERACTIONS ====================

export const likePost = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)

    // Check if already liked
    const existingLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: user.id
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.communityLike.delete({
        where: { id: existingLike.id }
      })

      await prisma.communityPost.update({
        where: { id },
        data: { likeCount: { decrement: 1 } }
      })

      return res.json({
        success: true,
        data: { liked: false }
      })
    }

    // Like
    await prisma.communityLike.create({
      data: {
        postId: id,
        userId: user.id
      }
    })

    await prisma.communityPost.update({
      where: { id },
      data: { likeCount: { increment: 1 } }
    })

    res.json({
      success: true,
      data: { liked: true }
    })
  } catch (error) {
    console.error('Like post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to like post'
    })
  }
}

export const sharePost = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)
    const { message, platform } = req.body

    const share = await prisma.communityShare.create({
      data: {
        postId: id,
        userId: user.id,
        message,
        platform
      }
    })

    await prisma.communityPost.update({
      where: { id },
      data: { shareCount: { increment: 1 } }
    })

    res.json({
      success: true,
      data: share
    })
  } catch (error) {
    console.error('Share post error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to share post'
    })
  }
}

// ==================== COMMENTS ====================

export const createComment = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)
    const { content, parentId } = req.body

    const comment = await prisma.communityComment.create({
      data: {
        postId: id,
        authorId: user.id,
        content,
        parentId
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    })

    await prisma.communityPost.update({
      where: { id },
      data: { commentCount: { increment: 1 } }
    })

    res.status(201).json({
      success: true,
      data: comment
    })
  } catch (error) {
    console.error('Create comment error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    })
  }
}

// ==================== GROUPS ====================

export const getGroups = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, category, organizationId } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {
      isActive: true,
    }

    if (type) where.type = type
    if (category) where.category = category
    if (organizationId) where.organizationId = organizationId

    const [groups, total] = await Promise.all([
      prisma.communityGroup.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          _count: {
            select: {
              members: true,
            }
          }
        },
        orderBy: [
          { isVerified: 'desc' },
          { memberCount: 'desc' }
        ]
      }),
      prisma.communityGroup.count({ where })
    ])

    res.json({
      success: true,
      data: groups,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get groups error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch groups'
    })
  }
}

export const createGroup = async (req: any, res: Response) => {
  try {
    const user = getUserFromRequest(req)
    const validatedData = createGroupSchema.parse(req.body)

    // Check if slug is unique
    const existingGroup = await prisma.communityGroup.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        error: 'Group slug already exists'
      })
    }

    const group = await prisma.communityGroup.create({
      data: {
        ...validatedData,
        ownerId: user.id,
        organizationId: user.organizationId,
        memberCount: 1, // Owner is the first member
      }
    })

    // Add owner as first member
    await prisma.communityGroupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: 'OWNER'
      }
    })

    res.status(201).json({
      success: true,
      data: group
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create group error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create group'
    })
  }
}

export const joinGroup = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)

    // Check if already a member
    const existingMembership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: user.id
        }
      }
    })

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this group'
      })
    }

    const group = await prisma.communityGroup.findUnique({
      where: { id }
    })

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      })
    }

    // Check if group is private/secret
    if (group.type !== 'PUBLIC') {
      return res.status(403).json({
        success: false,
        error: 'This group requires approval to join'
      })
    }

    // Add member
    await prisma.communityGroupMember.create({
      data: {
        groupId: id,
        userId: user.id,
        role: 'MEMBER'
      }
    })

    // Update member count
    await prisma.communityGroup.update({
      where: { id },
      data: { memberCount: { increment: 1 } }
    })

    res.json({
      success: true,
      data: { joined: true }
    })
  } catch (error) {
    console.error('Join group error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to join group'
    })
  }
}

export const leaveGroup = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)

    const membership = await prisma.communityGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: user.id
        }
      }
    })

    if (!membership) {
      return res.status(404).json({
        success: false,
        error: 'Not a member of this group'
      })
    }

    if (membership.role === 'OWNER') {
      return res.status(400).json({
        success: false,
        error: 'Group owner cannot leave the group'
      })
    }

    await prisma.communityGroupMember.delete({
      where: { id: membership.id }
    })

    await prisma.communityGroup.update({
      where: { id },
      data: { memberCount: { decrement: 1 } }
    })

    res.json({
      success: true,
      data: { left: true }
    })
  } catch (error) {
    console.error('Leave group error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to leave group'
    })
  }
}

// ==================== CHALLENGES ====================

export const getChallenges = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, type, difficulty, organizationId } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}

    if (status) where.status = status
    if (type) where.type = type
    if (difficulty) where.difficulty = difficulty
    if (organizationId) where.organizationId = organizationId

    const [challenges, total] = await Promise.all([
      prisma.communityChallenge.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          _count: {
            select: {
              submissions: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.communityChallenge.count({ where })
    ])

    res.json({
      success: true,
      data: challenges,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get challenges error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch challenges'
    })
  }
}

export const createChallenge = async (req: any, res: Response) => {
  try {
    const user = getUserFromRequest(req)
    const validatedData = createChallengeSchema.parse(req.body)

    const challenge = await prisma.communityChallenge.create({
      data: {
        ...validatedData,
        createdById: user.id,
        organizationId: user.organizationId,
        status: new Date() > validatedData.startDate ? 'ACTIVE' : 'UPCOMING',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: challenge
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      })
    }
    console.error('Create challenge error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create challenge'
    })
  }
}

export const submitToChallenge = async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const user = getUserFromRequest(req)
    const { title, description, files, links } = req.body

    // Check if challenge exists and is active
    const challenge = await prisma.communityChallenge.findUnique({
      where: { id }
    })

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found'
      })
    }

    if (challenge.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Challenge is not accepting submissions'
      })
    }

    // Check if already submitted
    const existingSubmission = await prisma.challengeSubmission.findUnique({
      where: {
        challengeId_userId: {
          challengeId: id,
          userId: user.id
        }
      }
    })

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        error: 'Already submitted to this challenge'
      })
    }

    // Check max participants
    if (challenge.maxParticipants && challenge.participantCount >= challenge.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Challenge has reached maximum participants'
      })
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId: id,
        userId: user.id,
        title,
        description,
        files: files || [],
        links: links || [],
        status: 'SUBMITTED'
      }
    })

    // Update participant count
    await prisma.communityChallenge.update({
      where: { id },
      data: { participantCount: { increment: 1 } }
    })

    res.status(201).json({
      success: true,
      data: submission
    })
  } catch (error) {
    console.error('Submit to challenge error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to submit to challenge'
    })
  }
}