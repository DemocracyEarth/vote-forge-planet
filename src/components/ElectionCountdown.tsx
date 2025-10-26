import { useEffect, useState } from "react";
import { Clock, Calendar, Infinity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ElectionCountdownProps {
  startDate: string | null;
  endDate: string | null;
  isOngoing: boolean | null;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function ElectionCountdown({ startDate, endDate, isOngoing }: ElectionCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeRemaining = (): TimeRemaining => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false,
      };
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  // No end date - ongoing election
  if (!endDate && isOngoing) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-primary/20 border border-blue-500/30">
        <Infinity className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Ongoing Election
          </p>
          <p className="text-xs text-muted-foreground">No end date - Real-time voting</p>
        </div>
      </div>
    );
  }

  // Has end date
  if (endDate && timeRemaining) {
    if (timeRemaining.isExpired) {
      return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-500/20 to-gray-500/10 border border-gray-500/30">
          <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Election Closed
            </p>
            <p className="text-xs text-muted-foreground">
              Ended: {new Date(endDate).toLocaleString()}
            </p>
          </div>
        </div>
      );
    }

    const getUrgencyColor = () => {
      if (timeRemaining.days > 7) return "from-green-500/20 to-green-500/10 border-green-500/30 text-green-600 dark:text-green-400";
      if (timeRemaining.days > 2) return "from-yellow-500/20 to-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400";
      if (timeRemaining.days >= 1) return "from-orange-500/20 to-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400";
      return "from-red-500/20 to-red-500/10 border-red-500/30 text-red-600 dark:text-red-400";
    };

    const getTimeText = () => {
      const { days, hours, minutes, seconds } = timeRemaining;
      
      // Calculate larger time units
      const centuries = Math.floor(days / 36500);
      const years = Math.floor(days / 365);
      const months = Math.floor(days / 30);
      const weeks = Math.floor(days / 7);
      
      // Centuries (100+ years)
      if (centuries > 0) {
        const remainingYears = years % 100;
        if (remainingYears > 0) {
          return `${centuries} ${centuries === 1 ? 'century' : 'centuries'}, ${remainingYears} ${remainingYears === 1 ? 'year' : 'years'}`;
        }
        return `${centuries} ${centuries === 1 ? 'century' : 'centuries'}`;
      }
      
      // Years (365+ days)
      if (years > 0) {
        const remainingMonths = Math.floor((days % 365) / 30);
        if (remainingMonths > 0) {
          return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
        }
        return `${years} ${years === 1 ? 'year' : 'years'}`;
      }
      
      // Months (30+ days)
      if (months > 0) {
        const remainingWeeks = Math.floor((days % 30) / 7);
        if (remainingWeeks > 0) {
          return `${months} ${months === 1 ? 'month' : 'months'}, ${remainingWeeks} ${remainingWeeks === 1 ? 'week' : 'weeks'}`;
        }
        return `${months} ${months === 1 ? 'month' : 'months'}`;
      }
      
      // Weeks (7+ days)
      if (weeks > 0) {
        const remainingDays = days % 7;
        if (remainingDays > 0) {
          return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}, ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
        }
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
      }
      
      // Days (1+ days)
      if (days > 0) {
        return `${days} ${days === 1 ? 'day' : 'days'}, ${hours}h ${minutes}m`;
      }
      
      // Hours
      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      }
      
      // Minutes
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      
      // Seconds only
      return `${seconds}s`;
    };

    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r border ${getUrgencyColor()}`}>
        <Clock className="h-5 w-5 animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-bold">
            Time Remaining: {getTimeText()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Closes: {new Date(endDate).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  // Fallback: Show start date if available
  if (startDate) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
        <Calendar className="h-3 w-3" />
        <span className="text-xs">Started: {new Date(startDate).toLocaleDateString()}</span>
      </div>
    );
  }

  return null;
}
