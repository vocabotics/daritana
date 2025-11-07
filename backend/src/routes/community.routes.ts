import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get community posts
router.get('/posts', authenticate, async (req, res) => {
  try {
    const { category, search } = req.query;
    
    // Mock posts for now
    const posts = [
      {
        id: '1',
        title: 'Best practices for sustainable architecture',
        content: 'Sharing insights on green building techniques...',
        author: {
          id: 'u1',
          name: 'Sarah Chen',
          role: 'Lead Architect',
          avatar: '/avatar1.jpg'
        },
        category: 'Sustainability',
        likes: 45,
        comments: 12,
        views: 234,
        tags: ['green', 'sustainable', 'architecture'],
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Modern tropical design trends in Malaysia',
        content: 'Exploring contemporary Malaysian architecture...',
        author: {
          id: 'u2',
          name: 'Ahmad Rahman',
          role: 'Interior Designer',
          avatar: '/avatar2.jpg'
        },
        category: 'Design Trends',
        likes: 67,
        comments: 23,
        views: 456,
        tags: ['tropical', 'modern', 'malaysia'],
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get post by ID
router.get('/posts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const post = {
      id,
      title: 'Best practices for sustainable architecture',
      content: 'Full article content here...',
      author: {
        id: 'u1',
        name: 'Sarah Chen',
        role: 'Lead Architect',
        avatar: '/avatar1.jpg'
      },
      category: 'Sustainability',
      likes: 45,
      comments: [],
      views: 234,
      tags: ['green', 'sustainable', 'architecture'],
      createdAt: new Date().toISOString()
    };
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
router.post('/posts', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user!;
    const { title, content, category, tags } = req.body;
    
    const post = {
      id: `p${Date.now()}`,
      title,
      content,
      authorId: userId,
      category,
      tags,
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: new Date().toISOString()
    };
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Like/unlike post
router.post('/posts/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({ success: true, liked: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Add comment
router.post('/posts/:id/comments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const { id: userId } = req.user!;
    
    const comment = {
      id: `c${Date.now()}`,
      postId: id,
      content,
      authorId: userId,
      createdAt: new Date().toISOString()
    };
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get events
router.get('/events', authenticate, async (req, res) => {
  try {
    // Mock events
    const events = [
      {
        id: 'e1',
        title: 'Architecture Summit 2024',
        description: 'Annual gathering of architects and designers',
        date: '2024-06-15',
        time: '09:00',
        location: 'KLCC Convention Centre',
        type: 'conference',
        attendees: 234,
        maxAttendees: 500,
        organizer: 'Malaysian Institute of Architects'
      },
      {
        id: 'e2',
        title: 'Sustainable Design Workshop',
        description: 'Hands-on workshop on green building',
        date: '2024-05-20',
        time: '14:00',
        location: 'Online',
        type: 'workshop',
        attendees: 45,
        maxAttendees: 50,
        organizer: 'Green Building Council'
      }
    ];
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Register for event
router.post('/events/:id/register', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({ success: true, registered: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// Get groups
router.get('/groups', authenticate, async (req, res) => {
  try {
    // Mock groups
    const groups = [
      {
        id: 'g1',
        name: 'Sustainable Architecture Malaysia',
        description: 'Community focused on green building',
        members: 1234,
        posts: 456,
        category: 'Sustainability',
        privacy: 'public',
        image: '/group1.jpg'
      },
      {
        id: 'g2',
        name: 'Interior Design Professionals',
        description: 'Network of interior designers',
        members: 890,
        posts: 234,
        category: 'Interior Design',
        privacy: 'private',
        image: '/group2.jpg'
      }
    ];
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Join group
router.post('/groups/:id/join', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({ success: true, joined: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Get connections
router.get('/connections', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user!;
    
    // Mock connections
    const connections = [
      {
        id: 'c1',
        user: {
          id: 'u2',
          name: 'Ahmad Rahman',
          role: 'Interior Designer',
          company: 'Design Studio KL',
          avatar: '/avatar2.jpg'
        },
        connectedAt: new Date().toISOString()
      },
      {
        id: 'c2',
        user: {
          id: 'u3',
          name: 'Lisa Wong',
          role: 'Project Manager',
          company: 'BuildTech Solutions',
          avatar: '/avatar3.jpg'
        },
        connectedAt: new Date().toISOString()
      }
    ];
    
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Send connection request
router.post('/connections/request', authenticate, async (req, res) => {
  try {
    const { userId: targetUserId, message } = req.body;
    const { id: userId } = req.user!;
    
    res.json({ success: true, requestSent: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send connection request' });
  }
});

export default router;