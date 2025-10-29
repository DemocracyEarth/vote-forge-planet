import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

interface Voter {
  id: string;
  voted_at: string;
  voter_id: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
  } | null;
}

interface VotersListModalProps {
  electionId: string;
  isOpen: boolean;
  onClose: () => void;
  totalVotes: number;
  electionTitle?: string;
}

export function VotersListModal({
  electionId,
  isOpen,
  onClose,
  totalVotes,
  electionTitle,
}: VotersListModalProps) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && electionId) {
      loadVoters();
    }
  }, [isOpen, electionId]);

  const loadVoters = async () => {
    setLoading(true);
    try {
      // First get voter registry entries
      const { data: voterData, error: voterError } = await supabase
        .from("voter_registry")
        .select("id, voted_at, voter_id")
        .eq("election_id", electionId)
        .order("voted_at", { ascending: false });

      if (voterError) {
        console.error("Error loading voter registry:", voterError);
        setLoading(false);
        return;
      }

      if (!voterData || voterData.length === 0) {
        setVoters([]);
        setLoading(false);
        return;
      }

      // Then get all the profiles for these voters
      const voterIds = voterData.map(v => v.voter_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", voterIds);

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
      }

      // Combine the data
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const votersWithProfiles = voterData.map(voter => ({
        ...voter,
        profiles: profilesMap.get(voter.voter_id) || null
      }));

      setVoters(votersWithProfiles);
    } catch (error) {
      console.error("Error loading voters:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {electionTitle ? `Voters for ${electionTitle}` : "Voters"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {totalVotes} {totalVotes === 1 ? "person has" : "people have"} voted
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : voters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No votes cast yet
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {voters.map((voter) => (
                <div
                  key={voter.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={voter.profiles?.avatar_url} />
                    <AvatarFallback>
                      {voter.profiles?.full_name
                        ? getInitials(voter.profiles.full_name)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {voter.profiles?.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Voted{" "}
                      {formatDistanceToNow(new Date(voter.voted_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
