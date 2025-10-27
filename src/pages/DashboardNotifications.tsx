import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, MessageSquare, UserPlus, Check, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NotificationMetadata {
  commenter_name?: string;
  comment_preview?: string;
  delegator_name?: string;
  delegator_id?: string;
  delegate_name?: string;
  election_title?: string;
  delegate_id?: string;
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

export default function DashboardNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    }

    const { data } = await query;

    if (data) {
      setNotifications(data as Notification[]);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
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
    
    loadNotifications();
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    switch (notification.notification_type) {
      case 'comment_reply':
        if (notification.election_id) {
          navigate(`/dashboard/discussions?election=${notification.election_id}`);
        }
        break;
      case 'delegation_received':
        if (notification.metadata?.delegator_id) {
          navigate(`/dashboard/users/${notification.metadata.delegator_id}`);
        }
        break;
      case 'delegator_voted':
        if (notification.election_id) {
          navigate(`/vote/${notification.election_id}`);
        }
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment_reply':
        return <MessageSquare className="h-5 w-5" />;
      case 'delegation_received':
        return <UserPlus className="h-5 w-5" />;
      case 'delegator_voted':
        return <Check className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
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
      default:
        return { title: 'New notification', description: '' };
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {notifications.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Eye className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold">No notifications</h3>
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet"}
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            notifications.map((notification) => {
              const { title, description } = getNotificationText(notification);
              return (
                <Card
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 cursor-pointer hover:bg-accent transition-colors ${
                    !notification.is_read ? 'border-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-primary">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-base font-medium leading-none">{title}</p>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                      {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                      )}
                      <p 
                        className="text-xs text-muted-foreground"
                        title={new Date(notification.created_at).toLocaleString()}
                      >
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
