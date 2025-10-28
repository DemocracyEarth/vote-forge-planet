import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, Chrome, Globe, CheckCircle2, XCircle, ExternalLink, Upload, Video, Camera, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { NotificationPreferences } from "./NotificationPreferences";

interface AuthProvider {
  id: string;
  provider: string;
  verified: boolean;
}

interface Delegator {
  id: string;
  delegator_id: string;
  created_at: string;
  active: boolean;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

export function DashboardProfile() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [providers, setProviders] = useState<AuthProvider[]>([]);
  const [uploading, setUploading] = useState(false);
  const [bio, setBio] = useState("");
  const [delegators, setDelegators] = useState<Delegator[]>([]);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        toast({
          title: t('auth.error'),
          description: "Failed to load user data",
          variant: "destructive",
        });
        return;
      }

      setUser(currentUser);

      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      setProfile(profileData);
      setBio(profileData?.bio || "");

      // Parse authentication providers from user identities
      const authProviders: AuthProvider[] = [];
      
      if (currentUser.identities && currentUser.identities.length > 0) {
        currentUser.identities.forEach((identity: any) => {
          authProviders.push({
            id: identity.id,
            provider: identity.provider,
            verified: true,
          });
        });
      }

      setProviders(authProviders);

      // Load delegators (users who delegated their vote to the current user)
      const { data: delegatorsData } = await supabase
        .from('delegations')
        .select('id, delegator_id, created_at, active')
        .eq('delegate_id', currentUser.id)
        .eq('active', true);

      // Fetch profiles for each delegator
      if (delegatorsData && delegatorsData.length > 0) {
        const delegatorIds = delegatorsData.map(d => d.delegator_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio')
          .in('id', delegatorIds);

        // Merge delegations with profiles
        const enrichedDelegators = delegatorsData.map(delegation => ({
          ...delegation,
          profiles: profilesData?.find(p => p.id === delegation.delegator_id) || {
            id: delegation.delegator_id,
            full_name: null,
            avatar_url: null,
            bio: null
          }
        }));

        setDelegators(enrichedDelegators);
      } else {
        setDelegators([]);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'google':
        return <Chrome className="h-5 w-5" />;
      case 'phone':
        return <Phone className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'email':
        return 'Email Authentication';
      case 'google':
        return 'Google Account';
      case 'phone':
        return 'Phone Number';
      default:
        return 'World ID';
    }
  };

  const handleLinkProvider = async (provider: string) => {
    toast({
      title: "Coming Soon",
      description: `Linking ${provider} accounts will be available soon.`,
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await loadUserData();
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Video must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-video.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-videos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-videos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_video_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await loadUserData();
      toast({
        title: "Success",
        description: "Profile video uploaded successfully. This will help others decide on vote delegation.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleBioSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bio updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          {t('dashboard.profile')}
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and authentication methods
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your public profile helps others decide on vote delegation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl">
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{profile?.full_name || 'Anonymous User'}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="outline" className="mt-2">
                  {user?.email_confirmed_at ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Email Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-yellow-500" />
                      Email Pending
                    </span>
                  )}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (visible to others for delegation decisions)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself and why they should delegate their vote to you..."
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{bio.length}/500</span>
                  <Button size="sm" onClick={handleBioSave}>
                    Save Bio
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Video Section */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Profile Video
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Introduce yourself to help others decide on vote delegation (max 50MB)
                  </p>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {profile?.profile_video_url ? "Replace Video" : "Upload Video"}
                </Button>
              </div>
              
              {profile?.profile_video_url && (
                <div className="rounded-lg overflow-hidden border border-primary/20">
                  <video
                    controls
                    className="w-full max-h-[400px]"
                    src={profile.profile_video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Methods Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Authentication Methods</CardTitle>
          <CardDescription>
            Your verified authentication providers. Link multiple methods to secure your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-background/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email Authentication</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Badge variant={providers.some(p => p.provider === 'email') ? "default" : "outline"}>
                {providers.some(p => p.provider === 'email') ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  "Not Linked"
                )}
              </Badge>
            </div>

            {/* Google */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-background/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Chrome className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Google Account</p>
                  <p className="text-sm text-muted-foreground">Sign in with your Google account</p>
                </div>
              </div>
              {providers.some(p => p.provider === 'google') ? (
                <Badge variant="default">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkProvider('google')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Link Account
                </Button>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-background/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">Verify via SMS</p>
                </div>
              </div>
              {providers.some(p => p.provider === 'phone') ? (
                <Badge variant="default">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkProvider('phone')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Link Phone
                </Button>
              )}
            </div>

            {/* World ID */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-background/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">World ID</p>
                  <p className="text-sm text-muted-foreground">Proof of humanity verification</p>
                </div>
              </div>
              {providers.some(p => p.provider === 'worldcoin') ? (
                <Badge variant="default">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkProvider('worldid')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify World ID
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voting Eligibility Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Voting Eligibility</CardTitle>
          <CardDescription>
            Your verification status determines which elections you can participate in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Verified Elections</span>
              <Badge variant={user?.email_confirmed_at ? "default" : "secondary"}>
                {user?.email_confirmed_at ? "Eligible" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Google Authenticated Elections</span>
              <Badge variant={providers.some(p => p.provider === 'google') ? "default" : "secondary"}>
                {providers.some(p => p.provider === 'google') ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Phone Verified Elections</span>
              <Badge variant={providers.some(p => p.provider === 'phone') ? "default" : "secondary"}>
                {providers.some(p => p.provider === 'phone') ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">World ID Elections</span>
              <Badge variant={providers.some(p => p.provider === 'worldcoin') ? "default" : "secondary"}>
                {providers.some(p => p.provider === 'worldcoin') ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Delegators Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              My Delegators
              {delegators.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {delegators.length}
                </Badge>
              )}
            </CardTitle>
          </div>
          <CardDescription>
            Users who have delegated their voting power to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {delegators.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No one has delegated their vote to you yet
              </p>
              <p className="text-xs text-muted-foreground">
                Build your profile and engage with the community to earn delegation trust
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {delegators.map((delegator) => (
                <Link
                  key={delegator.id}
                  to={`/profile/${delegator.delegator_id}`}
                  className="block"
                >
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-primary/10 bg-background/50 hover:bg-background/80 transition-colors">
                    <Avatar className="h-12 w-12 border border-primary/20">
                      <AvatarImage src={delegator.profiles.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                        {delegator.profiles.full_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">
                        {delegator.profiles.full_name || 'Anonymous User'}
                      </h4>
                      {delegator.profiles.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {delegator.profiles.bio.length > 100
                            ? `${delegator.profiles.bio.substring(0, 100)}...`
                            : delegator.profiles.bio}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Delegated on {format(new Date(delegator.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <NotificationPreferences />
    </div>
  );
}
