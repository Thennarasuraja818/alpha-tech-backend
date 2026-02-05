import { Request } from 'express';

export interface userRequest extends Request {
    user: {
        _id: string;
        userId: string;
        companyId: string;
        email: string;
        userType: string;
    };
}
