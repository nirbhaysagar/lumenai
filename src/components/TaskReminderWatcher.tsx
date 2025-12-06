
'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { DEMO_USER_ID } from '@/lib/constants';

export function TaskReminderWatcher() {
    const notifiedTasksRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // 1. Request Notification Permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Load notified tasks from local storage to avoid spam on reload
        const stored = localStorage.getItem('lumen_notified_tasks');
        if (stored) {
            notifiedTasksRef.current = new Set(JSON.parse(stored));
        }

        const checkTasks = async () => {
            // Check if notifications are enabled in settings (mocked for now, defaulting to true)
            const enabled = localStorage.getItem('lumen_notifications_enabled') !== 'false';
            if (!enabled) return;

            try {
                const res = await fetch(`/api/tasks?userId=${DEMO_USER_ID}`);
                const data = await res.json();

                if (!data.tasks) return;

                const highPriorityTasks = data.tasks.filter((t: any) => t.priority === 'high');

                highPriorityTasks.forEach((task: any) => {
                    if (!notifiedTasksRef.current.has(task.id)) {
                        // Send Notification
                        sendNotification(task);

                        // Mark as notified
                        notifiedTasksRef.current.add(task.id);
                        localStorage.setItem('lumen_notified_tasks', JSON.stringify(Array.from(notifiedTasksRef.current)));
                    }
                });

            } catch (error) {
                console.error('Failed to check tasks for reminders', error);
            }
        };

        // Check immediately and then every minute
        checkTasks();
        const interval = setInterval(checkTasks, 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const sendNotification = (task: any) => {
        const title = 'High Priority Task';
        const body = task.content;

        // 1. Browser Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/icon.png', // Assuming we have one, or fallback
                tag: task.id // Prevent duplicate notifications
            });
        }

        // 2. In-App Toast
        toast.info(title, {
            description: body,
            duration: 5000,
            action: {
                label: 'View',
                onClick: () => console.log('Navigate to task context') // TODO: Navigate
            }
        });
    };

    return null; // Headless component
}
