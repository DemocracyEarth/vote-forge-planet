import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Send,
  Loader2 
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface DiscussionThreadProps {
  electionId: string;
  userId: string | null;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: Record<string, string>;
  setReplyContent: (content: Record<string, string>) => void;
  handleSubmitComment: (parentId: string | null) => Promise<void>;
  submitting: boolean;
}

const CommentItem = ({ 
  comment, 
  depth = 0, 
  replyingTo, 
  setReplyingTo, 
  replyContent, 
  setReplyContent, 
  handleSubmitComment, 
  submitting 
}: CommentItemProps) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-border/30 pl-4' : ''}`}>
      <Card className="p-4 mb-3 bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/30 smooth-transition">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={comment.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {comment.profile?.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{comment.profile?.full_name || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="h-7 text-xs"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Reply
              </Button>
              
              {hasReplies && (
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      {isOpen ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                      {comment.replies?.length} {comment.replies?.length === 1 ? 'reply' : 'replies'}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent[comment.id] || ""}
                  onChange={(e) => setReplyContent({ ...replyContent, [comment.id]: e.target.value })}
                  className="min-h-[80px] text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitComment(comment.id)}
                    disabled={submitting || !replyContent[comment.id]?.trim()}
                  >
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                    Post Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent({ ...replyContent, [comment.id]: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {hasReplies && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-2">
            {comment.replies?.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                depth={depth + 1}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                handleSubmitComment={handleSubmitComment}
                submitting={submitting}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export const DiscussionThread = ({ electionId, userId }: DiscussionThreadProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
    subscribeToComments();
  }, [electionId]);

  const subscribeToComments = () => {
    const channel = supabase
      .channel('discussion-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussion_comments',
          filter: `election_id=eq.${electionId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('discussion_comments')
        .select('*')
        .eq('election_id', electionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build threaded structure
      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id)
      })) || [];

      const threaded = buildThreadedComments(commentsWithProfiles);
      setComments(threaded);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildThreadedComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const handleSubmitComment = async (parentId: string | null = null) => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to participate in the discussion",
        variant: "destructive",
      });
      return;
    }

    const content = parentId ? replyContent[parentId] : newComment;
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('discussion_comments')
        .insert({
          election_id: electionId,
          user_id: userId,
          parent_id: parentId,
          content: content.trim()
        });

      if (error) throw error;

      if (parentId) {
        setReplyContent({ ...replyContent, [parentId]: "" });
        setReplyingTo(null);
      } else {
        setNewComment("");
      }

      toast({
        title: "Comment posted",
        description: "Your comment has been added to the discussion",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold">Discussion</h2>
        <span className="text-sm text-muted-foreground">
          ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} comments)
        </span>
      </div>

      {userId ? (
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50">
          <div className="space-y-3">
            <Textarea
              placeholder="Share your thoughts on this proposal..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={() => handleSubmitComment(null)}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Post Comment
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center bg-muted/30 border-dashed">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Sign in to join the discussion</p>
        </Card>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card className="p-8 text-center bg-muted/20 border-dashed">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No comments yet. Be the first to start the discussion!</p>
          </Card>
        ) : (
          comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              handleSubmitComment={handleSubmitComment}
              submitting={submitting}
            />
          ))
        )}
      </div>
    </div>
  );
};