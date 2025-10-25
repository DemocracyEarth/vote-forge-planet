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
  my_comment_content: string;
  my_comment_created_at: string;
  reply_count: number;
  unread_replies: number;
  last_reply_at: string | null;
  last_replier_name: string | null;
  last_replier_avatar: string | null;
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
    subscribeToChanges();
  }, [userId]);

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('discussion-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussion_comments'
        },
        () => {
          loadDiscussions();
        }
      )
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
      // Get all comments made by the user
      const { data: myComments, error } = await supabase
        .from('discussion_comments')
        .select('id, content, created_at, election_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!myComments || myComments.length === 0) {
        setDiscussions([]);
        setLoading(false);
        return;
      }

      // Get election details
      const electionIds = [...new Set(myComments.map(c => c.election_id))];
      const { data: elections } = await supabase
        .from('elections')
        .select('id, title')
        .in('id', electionIds);

      const electionMap = new Map(elections?.map(e => [e.id, e]) || []);

      // For each comment, get reply count and unread notifications
      const discussionData = await Promise.all(
        myComments.map(async (comment) => {
          // Get all replies to this comment
          const { data: replies } = await supabase
            .from('discussion_comments')
            .select('id, user_id, created_at')
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: false });

          const replyCount = replies?.length || 0;

          // Get unread notifications for replies to this comment
          const { data: unreadNotifs } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .in('comment_id', replies?.map(r => r.id) || [])
            .eq('is_read', false);

          const unreadReplies = unreadNotifs?.length || 0;

          // Get last reply details
          let lastReplierName = null;
          let lastReplierAvatar = null;
          if (replies && replies.length > 0) {
            const lastReply = replies[0];
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', lastReply.user_id)
              .single();
            
            lastReplierName = profile?.full_name || 'Anonymous';
            lastReplierAvatar = profile?.avatar_url || null;
          }

          const election = electionMap.get(comment.election_id);

          return {
            id: comment.id,
            election_id: comment.election_id,
            election_title: election?.title || 'Unknown Election',
            my_comment_content: comment.content,
            my_comment_created_at: comment.created_at,
            reply_count: replyCount,
            unread_replies: unreadReplies,
            last_reply_at: replies && replies.length > 0 ? replies[0].created_at : null,
            last_replier_name: lastReplierName,
            last_replier_avatar: lastReplierAvatar,
          };
        })
      );

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

  const markAsRead = async (commentId: string) => {
    try {
      // Get all reply comment IDs for this parent comment
      const { data: replies } = await supabase
        .from('discussion_comments')
        .select('id')
        .eq('parent_id', commentId);

      if (!replies || replies.length === 0) return;

      const replyIds = replies.map(r => r.id);

      // Mark all notifications for these replies as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .in('comment_id', replyIds);

      if (error) throw error;

      // Update local state
      setDiscussions(prev =>
        prev.map(d => d.id === commentId ? { ...d, unread_replies: 0 } : d)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleViewDiscussion = async (discussion: Discussion) => {
    await markAsRead(discussion.id);
    navigate(`/vote/${discussion.election_id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalUnreadReplies = discussions.reduce((sum, d) => sum + d.unread_replies, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">My Discussions</h1>
          {totalUnreadReplies > 0 && (
            <Badge variant="default" className="ml-2">
              {totalUnreadReplies} new {totalUnreadReplies === 1 ? 'reply' : 'replies'}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-muted-foreground">
        All your comments and their replies across proposals
      </p>

      {discussions.length === 0 ? (
        <Card className="p-12 text-center bg-muted/20 border-dashed">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
          <p className="text-muted-foreground">
            Start commenting on proposals to see your discussions here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <Card
              key={discussion.id}
              className={`p-5 transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer ${
                discussion.unread_replies > 0 ? 'bg-primary/5 border-primary/20' : 'bg-card/60'
              }`}
              onClick={() => handleViewDiscussion(discussion)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {discussion.election_title}
                      </Badge>
                      {discussion.unread_replies > 0 && (
                        <Badge variant="default" className="text-xs">
                          {discussion.unread_replies} new {discussion.unread_replies === 1 ? 'reply' : 'replies'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your comment • {new Date(discussion.my_comment_created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 border-l-2 border-primary/30">
                  <p className="text-sm line-clamp-3">
                    {discussion.my_comment_content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span>{discussion.reply_count} {discussion.reply_count === 1 ? 'reply' : 'replies'}</span>
                    </div>
                    
                    {discussion.last_reply_at && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 border border-primary/20">
                          <AvatarImage src={discussion.last_replier_avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {discussion.last_replier_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-muted-foreground">
                          Last reply by {discussion.last_replier_name} • {new Date(discussion.last_reply_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDiscussion(discussion);
                    }}
                  >
                    View Thread
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
