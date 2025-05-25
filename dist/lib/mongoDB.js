//server/lib/mongoDB.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config(); // Make sure to load .env
export const connectToMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB Atlas');
    }
    catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process if connection fails
    }
};
