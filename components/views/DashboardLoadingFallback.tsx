import { Loader2 } from 'lucide-react';

interface DashboardLoadingFallbackProps {
  message: string;
  spinnerClassName: string;
}

export const DashboardLoadingFallback = ({
  message,
  spinnerClassName,
}: DashboardLoadingFallbackProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={40} className={`animate-spin ${spinnerClassName}`} />
        <span className="text-slate-500 font-bold text-sm">{message}</span>
      </div>
    </div>
  );
};
