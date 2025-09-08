import { v4 as uuidv4 } from "uuid";

const DEVICE_ID = 'n-device-id';

export const getDeviceId = () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
        return null; // Return null on server-side
    }
    
    let device_id = localStorage.getItem(DEVICE_ID);

    if (!device_id) {
        device_id = uuidv4();
        localStorage.setItem(DEVICE_ID, device_id);
    }

    return device_id;
};