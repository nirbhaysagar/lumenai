'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceMicProps {
    onTranscript: (text: string) => void;
    className?: string;
}

export function VoiceMic({ onTranscript, className }: VoiceMicProps) {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-ignore - SpeechRecognition is not yet in standard TS lib
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    setIsListening(true);
                    toast.info('Listening...', { duration: 2000 });
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    if (transcript) {
                        onTranscript(transcript);
                        toast.success('Voice captured');
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                    if (event.error === 'not-allowed' || event.error === 'audio-capture') {
                        toast.error('Microphone access denied. Check system permissions.');
                    } else {
                        toast.error('Voice recognition failed: ' + event.error);
                    }
                };

                setRecognition(recognition);
            }
        }
    }, [onTranscript]);

    const toggleListening = useCallback(() => {
        if (!recognition) {
            toast.error('Voice recognition not supported in this browser');
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }, [isListening, recognition]);

    if (!recognition) return null; // Don't render if not supported

    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(
                "transition-all duration-300 rounded-full",
                isListening ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 animate-pulse" : "text-muted-foreground hover:text-foreground",
                className
            )}
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Voice command"}
        >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
    );
}
