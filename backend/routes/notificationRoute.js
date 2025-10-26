import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  sendNotification,
  sendBulkNotification,
  listNotifications,
  getNotificationById,
  deleteNotification
} from '../controllers/notificationController.js';

const notificationRouter = express.Router();

// 🔐 Protect all notification routes
notificationRouter.post('/send', authMiddleware, sendNotification);
notificationRouter.post('/send-bulk', authMiddleware, sendBulkNotification);
notificationRouter.get('/list', authMiddleware, listNotifications);
notificationRouter.get('/:id', authMiddleware, getNotificationById);
notificationRouter.delete('/:id', authMiddleware, deleteNotification);

export default notificationRouter;
