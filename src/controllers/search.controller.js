import User from '../models/User.model.js';
import Post from '../models/Post.model.js';

// ✅ SEARCH POSTS (Fixed)
export const searchPosts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, posts: [] });

    // Simple text search on post content
    const posts = await Post.find({
      text: { $regex: q, $options: 'i' },
      isDeleted: false,
      visibility: 'public' // Only show public posts
    })
    .populate('uid', 'username name avatar verified') // Get user details for the post
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

// ✅ SEARCH USERS (Fixed to support Explore People)
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    // If no query provided, return empty list
    if (!q || q.trim() === '') {
      return res.json({ success: true, users: [] });
    }

    // Search by username OR name (case-insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    })
    .select('uid name username avatar isPrivate verified bio') // Only return necessary fields
    .limit(20);

    // The frontend expects a 'users' key in the response
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// Placeholder for Search All
export const searchAll = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Search all not yet implemented' });
  } catch (error) {
    next(error);
  }
};