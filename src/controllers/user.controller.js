import Follow from '../models/Follow.model.js';
import Post from '../models/Post.model.js';
import User from '../models/User.model.js';

// ==========================================
// 1. PROFILE & ACCOUNT
// ==========================================

// @desc    Get user profile by UID
// @route   GET /api/users/:uid
export const getUserProfile = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const currentUserId = req.user ? req.user._id : null;

    const user = await User.findOne({ uid }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check follow status
    let isFollowing = false;
    let isFollowedBy = false;

    if (currentUserId && currentUserId.toString() !== user._id.toString()) {
      const follow = await Follow.findOne({
        follower: currentUserId,
        following: user._id,
        status: 'accepted'
      });
      isFollowing = !!follow;

      const reverseFollow = await Follow.findOne({
        follower: user._id,
        following: currentUserId,
        status: 'accepted'
      });
      isFollowedBy = !!reverseFollow;
    }

    const postsCount = await Post.countDocuments({ uid: user._id, isDeleted: false });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        postsCount,
        isFollowing,
        isFollowedBy,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:uid
export const updateUserProfile = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { name, bio, avatar, coverImage, website, locationString, phone, isPrivate } = req.body;

    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (coverImage !== undefined) user.coverImage = coverImage;
    if (website !== undefined) user.website = website;
    if (locationString !== undefined) user.locationString = locationString;
    if (phone !== undefined) user.phone = phone;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    if (!user.profileCompleted && name && bio) {
      user.profileCompleted = true;
    }

    const updatedUser = await user.save();

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/users/me
// ✅ THIS EXPORT WAS MISSING causing the crash
export const deleteMyAccount = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    await User.deleteOne({ _id: currentUserId });
    // Also cleanup follows/posts if needed, but basic delete is here:
    await Follow.deleteMany({ $or: [{ follower: currentUserId }, { following: currentUserId }] });
    await Post.updateMany({ uid: currentUserId }, { isDeleted: true });
    
    return res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. FOLLOW SYSTEM
// ==========================================

// @desc    Follow a user
// @route   POST /api/users/:uid/follow
export const followUser = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const currentUserId = req.user._id;

    const targetUser = await User.findOne({ uid });
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (targetUser._id.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    }

    let follow = await Follow.findOne({
      follower: currentUserId,
      following: targetUser._id
    });

    if (follow) {
      return res.status(400).json({ success: false, message: 'Already following' });
    }

    const status = targetUser.isPrivate ? 'pending' : 'accepted';
    
    follow = await Follow.create({
      follower: currentUserId,
      following: targetUser._id,
      status: status
    });

    if (status === 'accepted') {
      await User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: 1 } });
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });
    }

    res.json({
      success: true,
      message: status === 'pending' ? 'Request sent' : 'Followed',
      follow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:uid/follow
export const unfollowUser = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const currentUserId = req.user._id;

    const targetUser = await User.findOne({ uid });
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const follow = await Follow.findOneAndDelete({
      follower: currentUserId,
      following: targetUser._id
    });

    if (!follow) return res.status(400).json({ success: false, message: 'Not following' });

    if (follow.status === 'accepted') {
      await User.findByIdAndUpdate(targetUser._id, { $inc: { followersCount: -1 } });
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });
    }

    res.json({ success: true, message: 'Unfollowed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:uid/followers
export const getFollowers = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const follows = await Follow.find({ following: user._id, status: 'accepted' })
      .populate('follower', 'uid username name avatar verified')
      .sort({ createdAt: -1 });

    const followers = follows.map(f => f.follower);
    
    res.json({ success: true, followers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get users that a user is following
// @route   GET /api/users/:uid/following
export const getFollowing = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const follows = await Follow.find({ follower: user._id, status: 'accepted' })
      .populate('following', 'uid username name avatar verified')
      .sort({ createdAt: -1 });

    const following = follows.map(f => f.following);

    res.json({ success: true, following });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. SEARCH & CONTENT
// ==========================================

// @desc    Search users
// @route   GET /api/users/search
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [] });

    const users = await User.find({
      $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }]
    }).select('uid name username avatar isPrivate verified bio').limit(20);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts of a user
// @route   GET /api/users/:uid/posts
export const getUserPosts = async (req, res, next) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const posts = await Post.find({ uid: user._id, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};