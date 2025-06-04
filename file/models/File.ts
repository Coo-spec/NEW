import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  name: String,
  url: String,
  size: Number,
  key: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 90, // 3 months in seconds
  },
});

export default mongoose.models.File || mongoose.model('File', FileSchema);
