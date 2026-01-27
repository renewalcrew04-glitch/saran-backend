import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, unique: true, sparse: true, index: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: null },
    coverImage: { type: String, default: null },
    bio: { type: String, maxlength: 500, default: '' },
    website: { type: String, default: '' },
    locationString: { type: String, default: '' },
    
    // ✅ ADDED: Phone Number
    phone: { type: String, default: '' },

    isPrivate: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    
    awsPushEndpointArn: { type: String, default: null },
    
    notificationSettings: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      reposts: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      spaces: { type: Boolean, default: true },
      spaceCategories: [{ type: String }],
      sosCloseFriends: { type: Boolean, default: true },
      sosNearby: { type: Boolean, default: true },
      moderation: { type: Boolean, default: true },
      wellness: { type: Boolean, default: false },
      sDaily: { type: Boolean, default: false }
    },
    
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },

    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    wellnessStreak: { type: Number, default: 0 },
    lastWellnessActivity: { type: Date, default: null },
    
    dmSettings: { type: String, enum: ['everyone', 'followers', 'no_one'], default: 'everyone' },
    commentSettings: { type: String, enum: ['everyone', 'followers', 'no_one'], default: 'everyone' },
    mutedWords: { type: [String], default: [] },
    mutedHashtags: { type: [String], default: [] },
    tagSettings: { type: String, enum: ['everyone', 'followers', 'no_one'], default: 'everyone' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ username: 'text', name: 'text' });
userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre('save', function (next) {
  if (!this.uid && this._id) {
    this.uid = this._id.toString();
  }
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual('followers', { ref: 'Follow', localField: '_id', foreignField: 'following' });
userSchema.virtual('following', { ref: 'Follow', localField: '_id', foreignField: 'follower' });

const User = mongoose.model('User', userSchema);
export default User;