import { Notification } from '../models/Notification';

export const isValidNotificationId = (notificationId: string): boolean => Boolean(notificationId);

export const shouldMarkNotificationAsRead = (notification: Notification): boolean => !notification.isRead;