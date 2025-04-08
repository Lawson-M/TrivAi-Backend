import mongoose from 'mongoose';
import { config } from '../config.js';

const uri = config.MONGO_URI;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

export async function connectDB() {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,  // Optional, to increase the timeout if needed
      });
      console.log("Successfully connected to MongoDB via Mongoose!");
    } catch (error) {
      console.error("Error connecting to MongoDB via Mongoose:", error);
      throw error;
    }
  }

export function getClient() {
  return client;
}

export async function closeConnection() {
  await client.close();
}