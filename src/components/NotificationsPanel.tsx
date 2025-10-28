import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, MessageSquare, UserPlus, Check, Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface NotificationMetadata {
  commenter_name?: string;
  comment_preview?: string;
  delegator_name?: string;
  delegator_id?: string;
  delegate_name?: string;
  election_title?: string;
  delegate_id?: string;
  creator_name?: string;
  restriction_type?: string;
}

interface Notification {
  id: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  comment_id?: string | null;
  election_id?: string | null;
  related_user_id?: string | null;
  metadata?: NotificationMetadata | null;
}

interface NotificationsPanelProps {
  unreadCount: number;
  onCountChange: () => void;
}

export const NotificationsPanel = ({ unreadCount, onCountChange }: NotificationsPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data as Notification[]);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    onCountChange();
    loadNotifications();
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    onCountChange();
    loadNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    setIsOpen(false);

    switch (notification.notification_type) {
      case 'comment_reply':
        if (notification.election_id) {
          navigate(`/dashboard/discussions?election=${notification.election_id}`);
        }
        break;
      case 'delegation_received':
        if (notification.metadata?.delegator_id) {
          navigate(`/profile/${notification.metadata.delegator_id}`);
        }
        break;
      case 'delegator_voted':
        if (notification.election_id) {
          navigate(`/vote/${notification.election_id}`);
        }
        break;
      case 'election_invitation':
        if (notification.election_id) {
          navigate(`/vote/${notification.election_id}`);
        }
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment_reply':
        return <MessageSquare className="h-4 w-4" />;
      case 'delegation_received':
        return <UserPlus className="h-4 w-4" />;
      case 'delegator_voted':
        return <Check className="h-4 w-4" />;
      case 'election_invitation':
        return <Mail className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.notification_type) {
      case 'comment_reply':
        return {
          title: `${notification.metadata?.commenter_name || 'Someone'} replied to your comment`,
          description: notification.metadata?.comment_preview,
        };
      case 'delegation_received':
        return {
          title: `${notification.metadata?.delegator_name || 'Someone'} delegated their vote to you`,
          description: 'They trust you to vote on their behalf',
        };
      case 'delegator_voted':
        return {
          title: `${notification.metadata?.delegate_name || 'Your delegate'} voted on your behalf`,
          description: notification.metadata?.election_title,
        };
      case 'election_invitation':
        return {
          title: `You've been invited to vote in ${notification.metadata?.election_title || 'an election'}`,
          description: `${notification.metadata?.creator_name || 'Someone'} invited you to participate`,
        };
      default:
        return { title: 'New notification', description: '' };
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Eye className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const { title, description } = getNotificationText(notification);
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      !notification.is_read ? 'bg-accent/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 text-primary">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{title}</p>
                        {description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {description}
                          </p>
                        )}
                        <p 
                          className="text-xs text-muted-foreground"
                          title={new Date(notification.created_at).toLocaleString()}
                        >
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => {
              setIsOpen(false);
              navigate('/dashboard/notifications');
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
