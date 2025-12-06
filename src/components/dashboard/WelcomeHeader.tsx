'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export function WelcomeHeader() {
    const [greeting, setGreeting] = useState('Welcome back');
    const [subtext, setSubtext] = useState('Ready to store some new knowledge?');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good morning, Bold');
            setSubtext('Your second brain is ready for the day.');
        } else if (hour < 18) {
            setGreeting('Good afternoon, Bold');
            setSubtext('Your LLM notes are looking sharp today.');
        } else {
            setGreeting('Good evening, Bold');
            setSubtext('Ready to capture some late-night insights?');
        }
    }, []);

    return (
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {greeting}
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
            </h1>
            <p className="text-muted-foreground text-lg">
                {subtext}
            </p>
        </div>
    );
}
