import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { PollModel, IPoll } from './models/Poll.js';
import pollRoutes from './routes/poll.routes.js';
import { connectToMongoDB } from './lib/mongoDB.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL;

if (!CLIENT_URL) {
  console.error('❌ CLIENT_URL is not defined in environment variables.');
  process.exit(1);
}

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

connectToMongoDB();

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Optional: Send heartbeat/ping to keep socket alive
  const heartbeat = setInterval(() => {
    socket.emit('ping');
  }, 25000);

  socket.on('join-poll', (pollId: string) => {
    socket.join(pollId);
    console.log(`👥 User ${socket.id} joined poll: ${pollId}`);
  });

  socket.on('submit-vote', async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
    try {
      console.log('📥 Received vote:', { pollId, optionId });

      const poll = await PollModel.findById(pollId);
      if (!poll) {
        console.warn('⚠️ Poll not found:', pollId);
        socket.emit('vote-error', { message: 'Poll not found' });
        return;
      }

      const optionIndex = poll.options.findIndex(
        (opt) => opt._id?.toString() === optionId
      );

      if (optionIndex === -1) {
        console.warn('⚠️ Option not found in poll:', optionId);
        socket.emit('vote-error', { message: 'Option not found in poll' });
        return;
      }

      poll.options[optionIndex].votes += 1;
      poll.markModified('options');
      await poll.save();

      console.log(`✅ Vote recorded for option ${optionId} in poll ${pollId}`);
      io.to(pollId).emit('poll-updated', poll);
    } catch (error) {
      console.error('❌ Vote submission error:', error);
      socket.emit('vote-error', { message: 'Failed to submit vote' });
    }
  });

  socket.on('create-poll', async (pollData: any) => {
    if (!pollData || !pollData.question || !Array.isArray(pollData.options)) {
      socket.emit('poll-creation-error', { message: 'Invalid poll data' });
      return;
    }

    try {
      const newPoll = new PollModel(pollData);
      await newPoll.save();
      io.emit('new-poll-created', newPoll);
    } catch (error) {
      console.error('❌ Poll creation error:', error);
      socket.emit('poll-creation-error', { message: 'Failed to create poll' });
    }
  });

  socket.on('disconnect', () => {
    clearInterval(heartbeat);
    console.log('❎ User disconnected:', socket.id);
  });
});

// API routes
app.use('/api/polls', pollRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Gracefully shutting down...');
  await mongoose.connection.close();
  server.close(() => {
    console.log('✅ Server closed. Bye!');
    process.exit(0);
  });
});
