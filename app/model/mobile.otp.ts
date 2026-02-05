import { Request } from 'express';
import AdminUserActivityLog from './Admin.User.Activity';

export const logAdminUserActivity = async (
  userId: any,
  req: Request | null,
  identifier: string,
  action: string
): Promise<void> => {
  try {
    const activityLog = new AdminUserActivityLog({
      userId: userId,
      userName: identifier,
      actionPerformed: action,
      ipAddress: req ? req.ip || (req as any).connection?.remoteAddress : 'N/A',
      deviceUsed: req ? req.headers['user-agent'] : 'N/A',
    });

    await activityLog.save();
  } catch (error) {
    console.error('Error logging admin user activity:', error);
  }
};