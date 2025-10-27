import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface NotificationPreference {
  notification_type: string;
  enabled: boolean;
}

const notificationTypes = [
  {
    type: 'comment_reply',
    label: 'Comment Replies',
    description: 'Get notified when someone replies to your comment',
  },
  {
    type: 'delegation_received',
    label: 'Delegation Received',
    description: 'Get notified when someone delegates their vote to you',
  },
  {
    type: 'delegator_voted',
    label: 'Delegator Voted',
    description: 'Get notified when your delegate votes on your behalf',
  },
  {
    type: 'election_started',
    label: 'Election Started',
    description: 'Get notified when an election you\'re watching starts',
  },
  {
    type: 'election_ending_soon',
    label: 'Election Ending Soon',
    description: 'Get notified 24 hours before an election closes',
  },
  {
    type: 'election_ended',
    label: 'Election Ended',
    description: 'Get notified when an election ends',
  },
];

export const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notification_preferences')
      .select('notification_type, enabled')
      .eq('user_id', user.id);

    if (data) {
      const prefs: Record<string, boolean> = {};
      data.forEach((pref: NotificationPreference) => {
        prefs[pref.notification_type] = pref.enabled;
      });
      setPreferences(prefs);
    }
    setLoading(false);
  };

  const updatePreference = async (notificationType: string, enabled: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notification_preferences')
      .update({ enabled })
      .eq('user_id', user.id)
      .eq('notification_type', notificationType);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } else {
      setPreferences((prev) => ({ ...prev, [notificationType]: enabled }));
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationTypes.map((type) => (
          <div key={type.type} className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor={type.type} className="cursor-pointer">
                {type.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {type.description}
              </p>
            </div>
            <Switch
              id={type.type}
              checked={preferences[type.type] ?? true}
              onCheckedChange={(checked) => updatePreference(type.type, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
