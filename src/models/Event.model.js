import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    hostUid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 2000
    },
    instructions: {
      type: String,
      default: ""
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    location: {
      type: String, 
      required: true // Will store "Online Event" for virtual meetings
    },
    // ✅ Added Meeting Link for Online Events
    meetingLink: {
      type: String,
      default: null
    },
    category: {
      type: String,
      default: 'Social'
    },
    price: {
      type: Number,
      default: 0
    },
    capacity: {
      type: Number,
      default: 50
    },
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    attendeesCount: {
      type: Number,
      default: 0
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    coverUrl: { type: String, default: null },
    videoUrl: { type: String, default: null },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, default: "" }
      }
    ]
  },
  { timestamps: true }
);

// Indexes
eventSchema.index({ startDate: 1 });
eventSchema.index({ hostUid: 1, createdAt: -1 });

const Event = mongoose.model('Event', eventSchema);

// Sync indexes to be safe
Event.syncIndexes();

export default Event;