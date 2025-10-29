import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, UserX } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DelegateButtonProps {
  delegateId: string;
  delegateName: string;
  currentUserId: string;
  myDelegation: { id: string; delegate_id: string } | null;
  onDelegationChange?: (newDelegation: { id: string; delegate_id: string } | null) => void;
  variant?: "default" | "outline" | "ghost";
  className?: string;
  showIcon?: boolean;
}

export function DelegateButton({
  delegateId,
  delegateName,
  currentUserId,
  myDelegation,
  onDelegationChange,
  variant = "default",
  className = "",
  showIcon = true,
}: DelegateButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isDelegated = myDelegation?.delegate_id === delegateId;

  const handleDelegate = async () => {
    // Prevent self-delegation
    if (currentUserId === delegateId) {
      toast({
        title: "Cannot delegate to yourself",
        description: "You cannot delegate your vote to your own account",
        variant: "destructive",
      });
      return;
    }

    // If already delegated to this person, revoke
    if (isDelegated) {
      await handleRevoke();
      return;
    }

    // If already delegated to someone else, show confirmation
    if (myDelegation && myDelegation.delegate_id !== delegateId) {
      setShowConfirmDialog(true);
      return;
    }

    // Otherwise, delegate directly
    await performDelegation();
  };

  const handleRevoke = async () => {
    if (!myDelegation) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("delegations")
        .update({ active: false })
        .eq("id", myDelegation.id);

      if (error) throw error;

      toast({
        title: "Delegation revoked",
        description: `You are no longer delegating to ${delegateName}`,
      });

      onDelegationChange?.(null);
    } catch (error) {
      console.error("Error revoking delegation:", error);
      toast({
        title: "Error",
        description: "Failed to revoke delegation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const performDelegation = async () => {
    try {
      setIsLoading(true);

      // First, deactivate ALL existing active delegations for this user
      const { error: deactivateError } = await supabase
        .from("delegations")
        .update({ active: false })
        .eq("delegator_id", currentUserId)
        .eq("active", true);

      if (deactivateError) throw deactivateError;

      // Now create/update the delegation to the new delegate
      const { data, error } = await supabase
        .from("delegations")
        .upsert(
          {
            delegator_id: currentUserId,
            delegate_id: delegateId,
            active: true,
          },
          {
            onConflict: "delegator_id,delegate_id",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (error) throw error;

      toast({
        title: myDelegation ? "Delegation updated" : "Vote delegated",
        description: `You are now delegating your vote to ${delegateName}`,
      });

      onDelegationChange?.(data);
    } catch (error) {
      console.error("Error managing delegation:", error);
      toast({
        title: "Error",
        description: "Failed to manage delegation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSwitch = async () => {
    setShowConfirmDialog(false);
    await performDelegation();
  };

  return (
    <>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Vote Delegation?</AlertDialogTitle>
            <AlertDialogDescription>
              You are currently delegating to someone else. Do you want to switch
              your delegation to {delegateName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>
              Switch Delegation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        onClick={handleDelegate}
        variant={isDelegated ? "outline" : variant}
        disabled={isLoading}
        className={className}
      >
        {showIcon && (
          isDelegated ? (
            <UserX className="h-4 w-4 mr-2" />
          ) : (
            <UserCheck className="h-4 w-4 mr-2" />
          )
        )}
        {isDelegated ? "Revoke Delegation" : "Delegate Vote"}
      </Button>
    </>
  );
}
