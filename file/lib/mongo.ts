import mongoose from 'mongoose';

let isConnected = false;

export async function connectToDB() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      dbName: 'filetransfer',
    });
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
} 
