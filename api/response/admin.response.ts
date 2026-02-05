export interface AdminUser {
    _id?: any;
    name: string;
    email: string;
    isActive: boolean;
    isDelete: boolean;
    role?: string;
    type?: string;
    phoneNumber?: string;
    userId?: string;
    permissions?: any;
    profileImage?:any
}