import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PollModel } from './models/Poll.js';
import pollRoutes from './routes/poll.routes.js';
import { connectToMongoDB } from './lib/mongoDB.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true,
    },
    transports: ['websocket'],
});
connectToMongoDB();
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join-poll', (pollId) => {
        socket.join(pollId);
        console.log(`User ${socket.id} joined poll: ${pollId}`);
    });
    socket.on('submit-vote', async ({ pollId, optionId }) => {
        try {
            console.log('📥 Received vote:', { pollId, optionId });
            const poll = await PollModel.findById(pollId);
            if (!poll) {
                console.warn('⚠️ Poll not found:', pollId);
                return;
            }
            const optionIndex = poll.options.findIndex((opt) => opt._id?.toString() === optionId);
            if (optionIndex === -1) {
                console.warn('⚠️ Option not found in poll:', optionId);
                return;
            }
            poll.options[optionIndex].votes += 1;
            poll.markModified('options'); // <- necessary to persist subdocument changes
            await poll.save();
            console.log(`✅ Vote recorded for option ${optionId} in poll ${pollId}`);
            io.to(pollId).emit('poll-updated', poll);
        }
        catch (error) {
            console.error('❌ Vote submission error:', error);
        }
    });
    socket.on('create-poll', async (pollData) => {
        try {
            const newPoll = new PollModel(pollData);
            await newPoll.save();
            io.emit('new-poll-created', newPoll);
        }
        catch (error) {
            console.error('Poll creation error:', error);
            socket.emit('poll-creation-error', { message: 'Failed to create poll' });
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
app.use('/api/polls', pollRoutes);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
