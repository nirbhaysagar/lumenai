'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, CheckCircle2, Sun, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DailyDigestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    digest: any;
}

export function DailyDigestModal({ open, onOpenChange, digest }: DailyDigestModalProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);

    if (!digest) return null;

    const content = digest.content || {};
    const { greeting, summary, focus, memory } = content;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-gradient-to-br from-background to-muted/20 border-none shadow-2xl">
                <DialogTitle className="sr-only">Daily Digest</DialogTitle>

                {/* Header Image / Gradient */}
                <div className="h-32 bg-gradient-to-r from-orange-400 to-rose-400 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10" />
                    <Sun className="w-16 h-16 text-white/90 animate-pulse" />
                    <div className="absolute bottom-4 left-6 text-white">
                        <h2 className="text-2xl font-bold">{greeting || "Good Morning!"}</h2>
                        <p className="text-white/80 text-sm">Here is your daily briefing.</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary Section */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Yesterday's Progress</h3>
                        <p className="text-lg leading-relaxed text-foreground/90">
                            {summary || "You had a quiet day yesterday. Ready to make today count?"}
                        </p>
                    </div>

                    {/* Focus Section */}
                    <div className="space-y-2 bg-primary/5 p-4 rounded-lg border border-primary/10">
                        <div className="flex items-center gap-2 text-primary font-medium">
                            <CheckCircle2 className="w-5 h-5" />
                            <h3>Today's Focus</h3>
                        </div>
                        <p className="text-foreground/80">
                            {focus || "Review your tasks and pick one big thing to accomplish."}
                        </p>
                    </div>

                    {/* Memory Section */}
                    {memory && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                Memory Resurfaced
                            </h3>
                            <div className="bg-muted/50 p-4 rounded-lg italic text-muted-foreground border border-border/50">
                                "{memory}"
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button onClick={() => onOpenChange(false)} className="gap-2">
                            Let's Go
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
