'use client';
import './globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function Home() {
    const router = useRouter();
    useEffect(() => {
        const user = api.getUser();
        if (user) {
            const role = user.role ? user.role.toLowerCase() : '';
            if (['admin', 'hr_admin'].includes(role)) {
                router.replace('/admin');
            } else {
                router.replace('/dashboard');
            }
        } else {
            router.replace('/login');
        }
    }, []);
    return (
        <div className="loading-page">
            <div className="spinner"></div>
        </div>
    );
}
