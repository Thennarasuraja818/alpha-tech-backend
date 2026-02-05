import path from 'path';

export const firebaseConfig = {
    lineman: {
        serviceAccount: path.join(__dirname, '../../views', 'rameshtraderslineman-firebase.json'),
        fcmEndpoint: "https://fcm.googleapis.com/v1/projects/ramesh-trader-lineman/messages:send"
    },
    deliveryman: {
        serviceAccount: path.join(__dirname, '../../views', 'rameshtradersdeliveryman-firebase.json'),
        fcmEndpoint: "https://fcm.googleapis.com/v1/projects/ramesh-traders-delivery-man/messages:send"
    }
};
