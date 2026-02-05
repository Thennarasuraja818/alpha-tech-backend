import { ObjectId } from 'mongoose';
import { Request } from 'express';
import AdminUserActivityLog from "../../app/model/Admin.User.Activity";
import AdminUsers from '../../app/model/admin.user';

export const logAdminUserActivity = async (userId: any,
    req: Request,
    userName: string,
    actionPerformed: string
): Promise<void> => {
    try {
        const ipAddress =
            (req.headers['x-forwarded-for'] as string) ||
            req.socket.remoteAddress ||
            req.ip;

        const userAgent = req.headers['user-agent'] || '';
        const deviceUsed = getDeviceUsed(userAgent);
        let email = userName;
        if (!userName) {
            const adminUser = await AdminUsers.findOne({ _id: userId });
            email = adminUser?.email ?? ''
        }

        const logEntry = new AdminUserActivityLog({
            userName: email,
            actionPerformed,
            dateTime: new Date(),
            ipAddress,
            deviceUsed,
            userId
        });
        await logEntry.save();

        console.log('User activity recorded.');
    } catch (err) {
        console.error('Error logging user activity:', err);
    }
};

// Helper: Detect device/browser from User-Agent
const getDeviceUsed = (userAgent: string): string => {
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    if (/windows nt 10/i.test(userAgent)) os = 'Windows 10';
    else if (/windows nt 11/i.test(userAgent)) os = 'Windows 11';
    else if (/mac os/i.test(userAgent)) os = 'MacOS';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';

    if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) browser = 'Safari';
    else if (/edg/i.test(userAgent)) browser = 'Edge';
    else if (/opr|opera/i.test(userAgent)) browser = 'Opera';
    else if (/msie|trident/i.test(userAgent)) browser = 'Internet Explorer';

    return `${os} - ${browser}`;
};
