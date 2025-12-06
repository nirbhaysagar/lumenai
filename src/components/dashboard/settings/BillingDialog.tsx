'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BillingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BillingDialog({ open, onOpenChange }: BillingDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Plans & Billing</DialogTitle>
                    <DialogDescription>
                        Manage your subscription and payment methods.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Current Plan */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Pro Plan</h3>
                                <p className="text-sm text-muted-foreground">Billed monthly • Next billing date: Jan 1, 2026</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="border-primary/50 bg-primary/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg">Current</div>
                            <CardHeader>
                                <CardTitle>Pro</CardTitle>
                                <CardDescription>For power users</CardDescription>
                                <div className="text-2xl font-bold mt-2">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited Contexts</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Advanced RAG</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Priority Support</li>
                                </ul>
                                <Button className="w-full mt-4" disabled>Current Plan</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Enterprise</CardTitle>
                                <CardDescription>For teams</CardDescription>
                                <div className="text-2xl font-bold mt-2">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Everything in Pro</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4" /> SSO & Admin Controls</li>
                                    <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Dedicated Success Manager</li>
                                </ul>
                                <Button variant="outline" className="w-full mt-4">Contact Sales</Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Payment Method</h4>
                        <div className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm">Visa ending in 4242</span>
                            </div>
                            <Button variant="link" size="sm">Edit</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
