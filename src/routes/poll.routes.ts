//server/routes/poll.routes.ts
import express, { Request, Response } from 'express';
import { PollModel, IPoll } from '../models/Poll.js';

const router = express.Router();

// GET /api/polls - Fetch all polls
router.get(
  '/',
  async (
    req: Request<{}, IPoll[] | { message: string }>,
    res: Response<IPoll[] | { message: string }>
  ) => {
    try {
      const polls = await PollModel.find().sort({ createdAt: -1 });
      res.json(polls);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/polls/:id - Fetch a single poll by ID
router.get(
  '/:id',
  async (
    req: Request<{ id: string }, IPoll | { message: string }>,
    res: Response<IPoll | { message: string }>
  ) => {
    try {
      const poll = await PollModel.findById(req.params.id);
      if (!poll) {
        res.status(404).json({ message: 'Poll not found' });
        return; // (optional) safer to stop execution
      }
      res.json(poll);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/polls - Create a new poll
router.post(
  '/',
  async (
    req: Request<{}, IPoll | { message: string }, IPoll>,
    res: Response<IPoll | { message: string }>
  ) => {
    try {
      const { title, description, options, expiresAt, isActive } = req.body;

      // Basic validation
      if (!title || !options || options.length < 2) {
        res.status(400).json({ message: 'Poll must have a title and at least two options' });
        return; // Just return after sending the response to stop further execution
      }
      const newPoll = new PollModel({
        title,
        description,
        options,
        expiresAt,
        isActive,
      });

      await newPoll.save();
      res.status(201).json(newPoll);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: 'Invalid poll data' });
    }
  }
);

export default router;