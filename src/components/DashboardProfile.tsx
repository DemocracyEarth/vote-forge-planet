import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, Chrome, Globe, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AuthProvider {
  id: string;
  provider: string;
  verified: boolean;
}

export function DashboardProfile() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [providers, setProviders] = useState<AuthProvider[]>([]);

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
          <CardDescription>Your account details and verification status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
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
    </div>
  );
}
