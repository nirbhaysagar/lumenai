import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorCardProps {
    title?: string;
    description?: string;
    retry?: () => void;
    className?: string;
}

export function ErrorCard({
    title = "Something went wrong",
    description = "An unexpected error occurred. Please try again.",
    retry,
    className
}: ErrorCardProps) {
    return (
        <Card className={`border-destructive/50 bg-destructive/5 ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </CardContent>
            {retry && (
                <CardFooter>
                    <Button variant="outline" onClick={retry} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
