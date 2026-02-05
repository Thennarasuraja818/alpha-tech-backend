import PushnotificationModel from '../../app/model/PushnotificationModel';
import { Types } from "mongoose";
import { firebaseConfig } from './firebaseConfig';
import { JWT } from 'google-auth-library';
import axios from 'axios';

export async function sendPush(appType: "lineman" | "deliveryman", token: string, title: string, input: any) {
    if (!token || typeof token !== 'string') {
        console.error('Invalid or empty token.');
        return false;
    }

    const config = firebaseConfig[appType];

    const client = new JWT({
        keyFile: config.serviceAccount,
        scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    try {
        const { token: accessToken } = await client.getAccessToken();
        if (!accessToken) {
            throw new Error('Failed to get access token');
        }

        console.log(`Sending notification to token: ${token}`, title, input);

        const message = {
            message: {
                token,
                notification: {
                    title,
                    body: input.content ?? "",
                },
                data: {
                    moduleName: input.moduleName ?? "",
                    moduleId: input.moduleId ?? ""
                }
            }
        };

        const response = await axios.post(config.fcmEndpoint, message, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            }
        });

        console.log(`${appType} notification sent successfully to token [${token}]:`, response.data);
        return response.data;

    } catch (err: any) {
        console.error(`${appType} Error sending notification::`, err?.response?.data || err.message);
        return false;
    }
}

export async function insertNotification(appType: "lineman" | "deliveryman", token: string, subject: string, msg: string, userId: Types.ObjectId) {
    try {
        const notification = await PushnotificationModel.create({
            subject,
            content: msg,
            userId,
            createdBy: userId
        });

        if (notification) {
            sendPush(appType, token, subject, { content: msg });
        }

    } catch (err: any) {
        console.error("Error sending notification:", err?.response?.data || err.message);
        return false;
    }
}
