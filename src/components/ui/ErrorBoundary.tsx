'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public reset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4 bg-muted/10 rounded-lg border border-destructive/20">
                    <div className="p-3 bg-destructive/10 rounded-full">
                        <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Something went wrong</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={this.reset} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
