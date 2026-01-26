import Event from "../models/Event.model.js";
import EventBooking from "../models/EventBooking.js";

/* ================= CREATE EVENT ================= */
export const createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      hostUid: req.user._id.toString(),
    });

    res.status(201).json(event);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

/* ================= GET EVENTS (CURSOR + joinedByMe) ================= */
export const getEvents = async (req, res) => {
  const { category, cursor, limit = 10 } = req.query;

  const match = { status: "published" };
  if (category && category !== "All") {
    match.category = category;
  }
  if (cursor) {
    match._id = { $lt: cursor };
  }

  const events = await Event.aggregate([
    { $match: match },
    { $sort: { _id: -1 } },
    { $limit: Number(limit) + 1 },

    {
      $lookup: {
        from: "eventbookings",
        let: { eventId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$eventId", "$$eventId"] },
                  { $eq: ["$uid", req.user._id.toString()] },
                ],
              },
            },
          },
        ],
        as: "myBooking",
      },
    },

    {
      $addFields: {
        joinedByMe: { $gt: [{ $size: "$myBooking" }, 0] },
      },
    },

    { $project: { myBooking: 0 } },
  ]);

  const hasNextPage = events.length > limit;
  const sliced = hasNextPage ? events.slice(0, limit) : events;

  res.json({
    items: sliced,
    nextCursor: hasNextPage ? sliced[sliced.length - 1]._id : null,
  });
};

/* ================= JOIN EVENT ================= */
export const joinEvent = async (req, res) => {
  const { id } = req.params;
  const uid = req.user._id.toString();

  const event = await Event.findById(id);
  if (!event) return res.status(404).json({ message: "Event not found" });

  const exists = await EventBooking.findOne({ eventId: id, uid });
  if (exists) {
    return res.status(400).json({ message: "Already joined" });
  }

  await EventBooking.create({ eventId: id, uid });
  await Event.findByIdAndUpdate(id, { $inc: { joinedCount: 1 } });

  res.json({ success: true });
};

/* ================= MY EVENTS ================= */
export const myEvents = async (req, res) => {
  const uid = req.user._id.toString();

  const bookings = await EventBooking.find({ uid }).populate("eventId");

  res.json(bookings.map((b) => b.eventId));
};
