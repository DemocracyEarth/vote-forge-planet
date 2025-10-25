import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Globe, List, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StepAuthRestrictionsProps {
  authenticationType: string;
  onDataChange?: (data: any) => void;
}

const COUNTRIES = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫", phone: "+93" },
  { code: "AL", name: "Albania", flag: "🇦🇱", phone: "+355" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿", phone: "+213" },
  { code: "AD", name: "Andorra", flag: "🇦🇩", phone: "+376" },
  { code: "AO", name: "Angola", flag: "🇦🇴", phone: "+244" },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬", phone: "+1-268" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", phone: "+54" },
  { code: "AM", name: "Armenia", flag: "🇦🇲", phone: "+374" },
  { code: "AU", name: "Australia", flag: "🇦🇺", phone: "+61" },
  { code: "AT", name: "Austria", flag: "🇦🇹", phone: "+43" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿", phone: "+994" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", phone: "+1-242" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", phone: "+973" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", phone: "+880" },
  { code: "BB", name: "Barbados", flag: "🇧🇧", phone: "+1-246" },
  { code: "BY", name: "Belarus", flag: "🇧🇾", phone: "+375" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", phone: "+32" },
  { code: "BZ", name: "Belize", flag: "🇧🇿", phone: "+501" },
  { code: "BJ", name: "Benin", flag: "🇧🇯", phone: "+229" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹", phone: "+975" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", phone: "+591" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦", phone: "+387" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", phone: "+267" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", phone: "+55" },
  { code: "BN", name: "Brunei", flag: "🇧🇳", phone: "+673" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", phone: "+359" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", phone: "+226" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", phone: "+257" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", phone: "+855" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", phone: "+237" },
  { code: "CA", name: "Canada", flag: "🇨🇦", phone: "+1" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻", phone: "+238" },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫", phone: "+236" },
  { code: "TD", name: "Chad", flag: "🇹🇩", phone: "+235" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phone: "+56" },
  { code: "CN", name: "China", flag: "🇨🇳", phone: "+86" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", phone: "+57" },
  { code: "KM", name: "Comoros", flag: "🇰🇲", phone: "+269" },
  { code: "CG", name: "Congo", flag: "🇨🇬", phone: "+242" },
  { code: "CD", name: "Congo (DRC)", flag: "🇨🇩", phone: "+243" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", phone: "+506" },
  { code: "HR", name: "Croatia", flag: "🇭🇷", phone: "+385" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", phone: "+53" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", phone: "+357" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", phone: "+420" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", phone: "+45" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯", phone: "+253" },
  { code: "DM", name: "Dominica", flag: "🇩🇲", phone: "+1-767" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴", phone: "+1-809" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", phone: "+593" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", phone: "+20" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", phone: "+503" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶", phone: "+240" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷", phone: "+291" },
  { code: "EE", name: "Estonia", flag: "🇪🇪", phone: "+372" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿", phone: "+268" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", phone: "+251" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯", phone: "+679" },
  { code: "FI", name: "Finland", flag: "🇫🇮", phone: "+358" },
  { code: "FR", name: "France", flag: "🇫🇷", phone: "+33" },
  { code: "GA", name: "Gabon", flag: "🇬🇦", phone: "+241" },
  { code: "GM", name: "Gambia", flag: "🇬🇲", phone: "+220" },
  { code: "GE", name: "Georgia", flag: "🇬🇪", phone: "+995" },
  { code: "DE", name: "Germany", flag: "🇩🇪", phone: "+49" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", phone: "+233" },
  { code: "GR", name: "Greece", flag: "🇬🇷", phone: "+30" },
  { code: "GD", name: "Grenada", flag: "🇬🇩", phone: "+1-473" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", phone: "+502" },
  { code: "GN", name: "Guinea", flag: "🇬🇳", phone: "+224" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼", phone: "+245" },
  { code: "GY", name: "Guyana", flag: "🇬🇾", phone: "+592" },
  { code: "HT", name: "Haiti", flag: "🇭🇹", phone: "+509" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", phone: "+504" },
  { code: "HU", name: "Hungary", flag: "🇭🇺", phone: "+36" },
  { code: "IS", name: "Iceland", flag: "🇮🇸", phone: "+354" },
  { code: "IN", name: "India", flag: "🇮🇳", phone: "+91" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", phone: "+62" },
  { code: "IR", name: "Iran", flag: "🇮🇷", phone: "+98" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶", phone: "+964" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", phone: "+353" },
  { code: "IL", name: "Israel", flag: "🇮🇱", phone: "+972" },
  { code: "IT", name: "Italy", flag: "🇮🇹", phone: "+39" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮", phone: "+225" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲", phone: "+1-876" },
  { code: "JP", name: "Japan", flag: "🇯🇵", phone: "+81" },
  { code: "JO", name: "Jordan", flag: "🇯🇴", phone: "+962" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", phone: "+7" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", phone: "+254" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮", phone: "+686" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", phone: "+965" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬", phone: "+996" },
  { code: "LA", name: "Laos", flag: "🇱🇦", phone: "+856" },
  { code: "LV", name: "Latvia", flag: "🇱🇻", phone: "+371" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧", phone: "+961" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸", phone: "+266" },
  { code: "LR", name: "Liberia", flag: "🇱🇷", phone: "+231" },
  { code: "LY", name: "Libya", flag: "🇱🇾", phone: "+218" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮", phone: "+423" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", phone: "+370" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", phone: "+352" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", phone: "+261" },
  { code: "MW", name: "Malawi", flag: "🇲🇼", phone: "+265" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", phone: "+60" },
  { code: "MV", name: "Maldives", flag: "🇲🇻", phone: "+960" },
  { code: "ML", name: "Mali", flag: "🇲🇱", phone: "+223" },
  { code: "MT", name: "Malta", flag: "🇲🇹", phone: "+356" },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭", phone: "+692" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷", phone: "+222" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺", phone: "+230" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", phone: "+52" },
  { code: "FM", name: "Micronesia", flag: "🇫🇲", phone: "+691" },
  { code: "MD", name: "Moldova", flag: "🇲🇩", phone: "+373" },
  { code: "MC", name: "Monaco", flag: "🇲🇨", phone: "+377" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳", phone: "+976" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪", phone: "+382" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", phone: "+212" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", phone: "+258" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", phone: "+95" },
  { code: "NA", name: "Namibia", flag: "🇳🇦", phone: "+264" },
  { code: "NR", name: "Nauru", flag: "🇳🇷", phone: "+674" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", phone: "+977" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", phone: "+31" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", phone: "+64" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", phone: "+505" },
  { code: "NE", name: "Niger", flag: "🇳🇪", phone: "+227" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", phone: "+234" },
  { code: "KP", name: "North Korea", flag: "🇰🇵", phone: "+850" },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰", phone: "+389" },
  { code: "NO", name: "Norway", flag: "🇳🇴", phone: "+47" },
  { code: "OM", name: "Oman", flag: "🇴🇲", phone: "+968" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", phone: "+92" },
  { code: "PW", name: "Palau", flag: "🇵🇼", phone: "+680" },
  { code: "PS", name: "Palestine", flag: "🇵🇸", phone: "+970" },
  { code: "PA", name: "Panama", flag: "🇵🇦", phone: "+507" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬", phone: "+675" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", phone: "+595" },
  { code: "PE", name: "Peru", flag: "🇵🇪", phone: "+51" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", phone: "+63" },
  { code: "PL", name: "Poland", flag: "🇵🇱", phone: "+48" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", phone: "+351" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", phone: "+974" },
  { code: "RO", name: "Romania", flag: "🇷🇴", phone: "+40" },
  { code: "RU", name: "Russia", flag: "🇷🇺", phone: "+7" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", phone: "+250" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳", phone: "+1-869" },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨", phone: "+1-758" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨", phone: "+1-784" },
  { code: "WS", name: "Samoa", flag: "🇼🇸", phone: "+685" },
  { code: "SM", name: "San Marino", flag: "🇸🇲", phone: "+378" },
  { code: "ST", name: "Sao Tome and Principe", flag: "🇸🇹", phone: "+239" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", phone: "+966" },
  { code: "SN", name: "Senegal", flag: "🇸🇳", phone: "+221" },
  { code: "RS", name: "Serbia", flag: "🇷🇸", phone: "+381" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", phone: "+248" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱", phone: "+232" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", phone: "+65" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", phone: "+421" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", phone: "+386" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧", phone: "+677" },
  { code: "SO", name: "Somalia", flag: "🇸🇴", phone: "+252" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", phone: "+27" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", phone: "+82" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸", phone: "+211" },
  { code: "ES", name: "Spain", flag: "🇪🇸", phone: "+34" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", phone: "+94" },
  { code: "SD", name: "Sudan", flag: "🇸🇩", phone: "+249" },
  { code: "SR", name: "Suriname", flag: "🇸🇷", phone: "+597" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", phone: "+46" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", phone: "+41" },
  { code: "SY", name: "Syria", flag: "🇸🇾", phone: "+963" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", phone: "+886" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯", phone: "+992" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", phone: "+255" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", phone: "+66" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱", phone: "+670" },
  { code: "TG", name: "Togo", flag: "🇹🇬", phone: "+228" },
  { code: "TO", name: "Tonga", flag: "🇹🇴", phone: "+676" },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹", phone: "+1-868" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳", phone: "+216" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", phone: "+90" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲", phone: "+993" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻", phone: "+688" },
  { code: "UG", name: "Uganda", flag: "🇺🇬", phone: "+256" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", phone: "+380" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", phone: "+971" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", phone: "+44" },
  { code: "US", name: "United States", flag: "🇺🇸", phone: "+1" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", phone: "+598" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿", phone: "+998" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺", phone: "+678" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦", phone: "+379" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", phone: "+58" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", phone: "+84" },
  { code: "YE", name: "Yemen", flag: "🇾🇪", phone: "+967" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲", phone: "+260" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇪", phone: "+263" },
];

const StepAuthRestrictions = ({ authenticationType, onDataChange }: StepAuthRestrictionsProps) => {
  const [restrictionType, setRestrictionType] = useState<string>("open");
  const [allowedEmails, setAllowedEmails] = useState<string>("");
  const [allowedDomains, setAllowedDomains] = useState<string>("");
  const [allowedPhones, setAllowedPhones] = useState<string>("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState<string>("");
  const [worldIdConfig, setWorldIdConfig] = useState<string>("");

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries(prev => 
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'email' | 'phone') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    if (type === 'email') {
      setAllowedEmails(lines.join('\n'));
    } else {
      setAllowedPhones(lines.join('\n'));
    }
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.phone.includes(countrySearch)
  );

  useEffect(() => {
    if (onDataChange) {
      const data: any = {
        restrictionType,
      };

      if (authenticationType === "email" || authenticationType === "google") {
        if (restrictionType === "email-list") {
          data.allowedEmails = allowedEmails.split("\n").filter(e => e.trim());
        } else if (restrictionType === "domain") {
          data.allowedDomains = allowedDomains.split(",").map(d => d.trim()).filter(d => d);
        }
      } else if (authenticationType === "phone") {
        if (restrictionType === "phone-list") {
          data.allowedPhones = allowedPhones.split("\n").filter(p => p.trim());
        } else if (restrictionType === "country") {
          data.allowedCountries = selectedCountries;
        }
      } else if (authenticationType === "worldid") {
        data.worldIdConfig = worldIdConfig;
      }

      onDataChange(data);
    }
  }, [restrictionType, allowedEmails, allowedDomains, allowedPhones, selectedCountries, worldIdConfig, authenticationType, onDataChange]);

  const renderEmailGoogleRestrictions = () => (
    <div className="space-y-6">
      <RadioGroup value={restrictionType} onValueChange={setRestrictionType}>
        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="open" id="open" />
            <Label htmlFor="open" className="flex items-center gap-2 cursor-pointer flex-1">
              <Globe className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Open Access</div>
                <div className="text-sm text-muted-foreground">Anyone with {authenticationType} can vote</div>
              </div>
            </Label>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email-list" id="email-list" />
            <Label htmlFor="email-list" className="flex items-center gap-2 cursor-pointer flex-1">
              <List className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Allowed Email List</div>
                <div className="text-sm text-muted-foreground">Only specific email addresses can vote</div>
              </div>
            </Label>
          </div>
          {restrictionType === "email-list" && (
            <div className="mt-4 ml-8">
              <div className="flex items-center gap-2 mb-3">
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => handleFileUpload(e, 'email')}
                  className="hidden"
                  id="email-csv-upload"
                />
                <Label
                  htmlFor="email-csv-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Upload CSV/TXT</span>
                </Label>
                <span className="text-xs text-muted-foreground">or enter manually below</span>
              </div>
              <Textarea
                placeholder="Enter email addresses (one per line)&#10;example@domain.com&#10;another@example.org"
                value={allowedEmails}
                onChange={(e) => setAllowedEmails(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter one email address per line, or upload a CSV/TXT file with one email per line
              </p>
            </div>
          )}
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="domain" id="domain" />
            <Label htmlFor="domain" className="flex items-center gap-2 cursor-pointer flex-1">
              <Lock className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Domain Restriction</div>
                <div className="text-sm text-muted-foreground">Only emails from specific domains</div>
              </div>
            </Label>
          </div>
          {restrictionType === "domain" && (
            <div className="mt-4 ml-8">
              <Input
                placeholder="example.com, company.org"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter domain names separated by commas
              </p>
            </div>
          )}
        </Card>
      </RadioGroup>
    </div>
  );

  const renderPhoneRestrictions = () => (
    <div className="space-y-6">
      <RadioGroup value={restrictionType} onValueChange={setRestrictionType}>
        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="open" id="phone-open" />
            <Label htmlFor="phone-open" className="flex items-center gap-2 cursor-pointer flex-1">
              <Globe className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Open Access</div>
                <div className="text-sm text-muted-foreground">Any phone number can vote</div>
              </div>
            </Label>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="phone-list" id="phone-list" />
            <Label htmlFor="phone-list" className="flex items-center gap-2 cursor-pointer flex-1">
              <List className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Allowed Phone List</div>
                <div className="text-sm text-muted-foreground">Only specific phone numbers can vote</div>
              </div>
            </Label>
          </div>
          {restrictionType === "phone-list" && (
            <div className="mt-4 ml-8">
              <div className="flex items-center gap-2 mb-3">
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => handleFileUpload(e, 'phone')}
                  className="hidden"
                  id="phone-csv-upload"
                />
                <Label
                  htmlFor="phone-csv-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Upload CSV/TXT</span>
                </Label>
                <span className="text-xs text-muted-foreground">or enter manually below</span>
              </div>
              <Textarea
                placeholder="Enter phone numbers with country code (one per line)&#10;+1234567890&#10;+9876543210"
                value={allowedPhones}
                onChange={(e) => setAllowedPhones(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter one phone number per line with country code (e.g., +1234567890), or upload a CSV/TXT file
              </p>
            </div>
          )}
        </Card>

        <Card className="p-4 cursor-pointer hover:border-primary/50 transition-colors">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="country" id="country" />
            <Label htmlFor="country" className="flex items-center gap-2 cursor-pointer flex-1">
              <Lock className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">Country Restriction</div>
                <div className="text-sm text-muted-foreground">Only phone numbers from specific countries</div>
              </div>
            </Label>
          </div>
          {restrictionType === "country" && (
            <div className="mt-4 ml-8 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Selected: {selectedCountries.length} {selectedCountries.length === 1 ? 'country' : 'countries'}
                </p>
                {selectedCountries.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCountries([])}
                    className="h-8 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <Input
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="mb-2"
              />
              <Card className="border-2">
                <ScrollArea className="h-[280px] w-full">
                  <div className="p-2 space-y-1">
                    {filteredCountries.map((country) => {
                      const isSelected = selectedCountries.includes(country.code);
                      return (
                        <div
                          key={country.code}
                          onClick={() => toggleCountry(country.code)}
                          className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 border border-primary'
                              : 'hover:bg-muted border border-transparent'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCountry(country.code)}
                            className="pointer-events-none"
                          />
                          <span className="text-xl">{country.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{country.name}</div>
                            <div className="text-xs text-muted-foreground">{country.code} • {country.phone}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        </div>
                      );
                    })}
                    {filteredCountries.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No countries found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
              <p className="text-xs text-muted-foreground">
                Select one or more countries to restrict phone authentication
              </p>
            </div>
          )}
        </Card>
      </RadioGroup>
    </div>
  );

  const renderWorldIdRestrictions = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="worldid-config" className="text-base font-semibold">World ID Configuration</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Configure World ID verification parameters
            </p>
          </div>
          <Textarea
            id="worldid-config"
            placeholder="Enter World ID configuration parameters (JSON format)&#10;{&#10;  &quot;verification_level&quot;: &quot;orb&quot;,&#10;  &quot;action&quot;: &quot;vote&quot;&#10;}"
            value={worldIdConfig}
            onChange={(e) => setWorldIdConfig(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            World ID provides proof-of-human verification. Configure verification level and action parameters.
          </p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Access Restrictions</h2>
        <p className="text-muted-foreground">
          Configure who can participate in this vote using {authenticationType} authentication
        </p>
      </div>

      {(authenticationType === "email" || authenticationType === "google") && renderEmailGoogleRestrictions()}
      {authenticationType === "phone" && renderPhoneRestrictions()}
      {authenticationType === "worldid" && renderWorldIdRestrictions()}

      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Security Note:</strong> These restrictions will be enforced during the voting process to ensure only authorized users can participate.
        </p>
      </div>
    </div>
  );
};

export default StepAuthRestrictions;
