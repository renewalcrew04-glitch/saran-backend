import Follow from "../models/Follow.model.js";
import User from "../models/User.model.js";

// @desc    Follow a user (From Explore/Search)
// @route   POST /api/follow/:uid
export const followUser = async (req, res, next) => {
  try {
    const followerId = req.user._id;
    const { uid } = req.params;

    // 1. Find Target
    const target = await User.findOne({ uid });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    // 2. Prevent Self Follow
    if (target._id.toString() === followerId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    // 3. Check Existing
    const existing = await Follow.findOne({ follower: followerId, following: target._id });
    if (existing) return res.status(400).json({ success: false, message: "Already following" });

    // 4. Create Follow
    const status = target.isPrivate ? "pending" : "accepted";
    await Follow.create({
      follower: followerId,
      following: target._id,
      status
    });

    // 5. ✅ CRITICAL: Update Counts
    if (status === "accepted") {
      await User.findByIdAndUpdate(target._id, { $inc: { followersCount: 1 } });
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    }

    res.json({ success: true, message: "Followed" });
  } catch (err) {
    next(err);
  }
};

// @desc    Unfollow a user (From Explore/Search)
// @route   DELETE /api/follow/:uid
export const unfollowUser = async (req, res, next) => {
  try {
    const followerId = req.user._id;
    const { uid } = req.params;

    const target = await User.findOne({ uid });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    const deleted = await Follow.findOneAndDelete({ follower: followerId, following: target._id });

    if (deleted && deleted.status === "accepted") {
      // ✅ CRITICAL: Update Counts
      await User.findByIdAndUpdate(target._id, { $inc: { followersCount: -1 } });
      await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
    }

    res.json({ success: true, message: "Unfollowed" });
  } catch (err) {
    next(err);
  }
};