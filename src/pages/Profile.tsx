import { useParams, useNavigate } from "react-router-dom";
import { UserProfileView } from "@/components/UserProfileView";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg">
      {/* Controls positioned top right */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <UserProfileView />
      </div>
    </div>
  );
};

export default Profile;
