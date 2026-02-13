import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from './button';

interface PageLoadingStateProps {
  message?: string;
}

export function PageLoadingState({ message }: PageLoadingStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

interface PageErrorStateProps {
  message: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function PageErrorState({ message, onAction, actionLabel }: PageErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-2">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <p className="text-muted-foreground">{message}</p>
        {onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel || '다시 시도'}
          </Button>
        )}
      </div>
    </div>
  );
}
