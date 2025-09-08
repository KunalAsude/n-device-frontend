'use client'
import API from '@/lib/api';
import { getDeviceId } from '@/lib/device';
import { useUser } from '@auth0/nextjs-auth0';
import React, { useEffect, useState } from 'react'

const Dashboard = () => {
    const { user, error, isLoading } = useUser();
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        const id = getDeviceId();
        setDeviceId(id);
    }, []);

    const device_login = () => {
        if (!user?.sub || !deviceId) return;
        
        const response = API.post(`/auth/login/${user.sub}`, null, {
            params: { device_id: deviceId },
        });
        return response;
    };

    if (isLoading) {
        return <>Loading...</>;
    }

    if (error) {
        return <>Error: {error.message}</>;
    }

    return (
        <>
            <div>User: {user?.name}</div>
            <div>Device ID: {deviceId || 'Loading device ID...'}</div>
            <button className='bg-blue-600 p-2 m-2' onClick={device_login}>Device Login</button>
        </>
    );
};

export default Dashboard;