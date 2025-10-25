import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Discussion {
  id: string;
  election_id: string;
  election_title: string;
  comment_content: string;
  comment_created_at: string;
  commenter_name: string;
  commenter_avatar: string | null;
  is_read: boolean;
  notification_id: string;
}

interface DashboardDiscussionsProps {
  userId: string;
}

export const DashboardDiscussions = ({ userId }: DashboardDiscussionsProps) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadDiscussions();
    subscribeToNotifications();
  }, [userId]);

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          loadDiscussions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadDiscussions = async () => {
    try {
      // Get notifications with related comment and election data
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('id, comment_id, election_id, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!notifications || notifications.length === 0) {
        setDiscussions([]);
        setLoading(false);
        return;
      }

      // Get comment details
      const commentIds = notifications.map(n => n.comment_id);
      const { data: comments } = await supabase
        .from('discussion_comments')
        .select('id, content, created_at, user_id')
        .in('id', commentIds);

      // Get election details
      const electionIds = [...new Set(notifications.map(n => n.election_id))];
      const { data: elections } = await supabase
        .from('elections')
        .select('id, title')
        .in('id', electionIds);

      // Get commenter profiles
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const commentMap = new Map(comments?.map(c => [c.id, c]) || []);
      const electionMap = new Map(elections?.map(e => [e.id, e]) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const discussionData = notifications.map(notification => {
        const comment = commentMap.get(notification.comment_id);
        const election = electionMap.get(notification.election_id);
        const profile = comment ? profileMap.get(comment.user_id) : null;

        return {
          id: notification.comment_id,
          election_id: notification.election_id,
          election_title: election?.title || 'Unknown Election',
          comment_content: comment?.content || '',
          comment_created_at: comment?.created_at || notification.created_at,
          commenter_name: profile?.full_name || 'Anonymous',
          commenter_avatar: profile?.avatar_url || null,
          is_read: notification.is_read,
          notification_id: notification.id,
        };
      });

      setDiscussions(discussionData);
    } catch (error) {
      console.error('Error loading discussions:', error);
      toast({
        title: "Error",
        description: "Failed to load discussions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setDiscussions(prev =>
        prev.map(d => d.notification_id === notificationId ? { ...d, is_read: true } : d)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleViewDiscussion = async (discussion: Discussion) => {
    await markAsRead(discussion.notification_id);
    navigate(`/vote/${discussion.election_id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = discussions.filter(d => !d.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Discussions</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </div>

      {discussions.length === 0 ? (
        <Card className="p-12 text-center bg-muted/20 border-dashed">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
          <p className="text-muted-foreground">
            When someone replies to your comments, they'll appear here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <Card
              key={discussion.notification_id}
              className={`p-5 transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer ${
                !discussion.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card/60'
              }`}
              onClick={() => handleViewDiscussion(discussion)}
            >
              <div className="flex gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={discussion.commenter_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {discussion.commenter_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        {discussion.commenter_name}
                        {!discussion.is_read && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        replied to your comment • {new Date(discussion.comment_created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {discussion.comment_content}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">
                      {discussion.election_title}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDiscussion(discussion);
                      }}
                    >
                      View Discussion
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
