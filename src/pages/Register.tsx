import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2, User, Mail, Lock, BedDouble, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

export default function Register() {
  const [hospitalName, setHospitalName] = useState("");
  const [tier, setTier] = useState("Tier-2");
  const [beds, setBeds] = useState("20");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer to prevent rate limiting
  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim() || !adminName.trim()) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (cooldown > 0) {
      toast({ title: "Please wait", description: `Try again in ${cooldown} seconds to avoid rate limiting.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Create the auth user with admin role metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password,
        options: {
          data: { full_name: adminName, role: "admin", department: "ICU" },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        // Parse Supabase error codes for user-friendly messages
        const msg = authError.message?.toLowerCase() || "";
        const status = (authError as any).status;

        if (status === 429 || msg.includes("rate") || msg.includes("too many")) {
          startCooldown(60);
          throw new Error("Too many signup attempts. Please wait 60 seconds before trying again.");
        }
        if (msg.includes("already registered") || msg.includes("already been registered")) {
          throw new Error("This email is already registered. Try logging in instead.");
        }
        if (msg.includes("invalid") && msg.includes("email")) {
          throw new Error("Please enter a valid email address (e.g. doctor@hospital.org).");
        }
        if (msg.includes("password")) {
          throw new Error("Password must be at least 6 characters.");
        }
        // Generic Supabase error
        throw new Error(authError.message || "Signup failed. Please try again.");
      }

      if (!authData.user) throw new Error("Failed to create user account");

      // Check if user was actually created or if email is unconfirmed duplicate
      // Supabase returns a user object even for existing unconfirmed emails
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error("This email is already registered. Please check your email for a confirmation link, or try logging in.");
      }

      // 2. Create the hospital record
      const { data: hospital, error: hospError } = await supabase
        .from("hospitals")
        .insert({ name: hospitalName, tier, total_icu_beds: parseInt(beds) || 20 })
        .select("id")
        .single();
      if (hospError) throw hospError;

      // 3. Link the admin profile to the hospital
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ hospital_id: hospital.id, role: "admin" })
        .eq("user_id", authData.user.id);
      if (profileError) throw profileError;

      // Start cooldown to prevent rapid re-submissions
      startCooldown(30);

      toast({
        title: "✅ Hospital registered!",
        description: "Check your email to verify your account, then sign in.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden bg-slate-50 selection:bg-primary/30">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Light background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-50"></div>
        
        {/* Refined Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>
      </div>
      
      {/* Header controls */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute top-6 right-6 z-50 flex items-center gap-4"
      >
        <Button 
          variant="ghost" 
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 backdrop-blur-md rounded-full px-6 transition-all duration-300" 
          onClick={() => navigate("/")}
        >
          <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
          Home
        </Button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[500px] relative z-10"
      >
        <div className="flex flex-col items-center gap-6 mb-8">
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center backdrop-blur-2xl group cursor-pointer"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Logo size={48} className="relative z-10" />
          </motion.div>
          
          <motion.div variants={itemVariants} className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sepsis<span className="text-blue-600 ml-1">Sentinel</span>
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em]">
              Hospital Registry
            </p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="bg-white border-slate-200 shadow-xl overflow-hidden relative">
            {/* Subtle highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
            
            <CardHeader className="pb-6 pt-8 px-8">
              <CardTitle className="text-xl font-medium text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Organization Details
              </CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Initialize your workspace and admin credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleRegister} className="space-y-8">
                
                {/* Hospital Section */}
                <div className="space-y-5">
                  <div className="space-y-2 group/input">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Hospital Name</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-focus-within/input:bg-primary/20">
                        <Building2 className="h-3 w-3 text-primary" />
                      </div>
                      <Input
                        placeholder="AIIMS New Delhi"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        className="pl-11 h-12 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl text-slate-900 placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2 group/input">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Tier</Label>
                      <Select value={tier} onValueChange={setTier}>
                        <SelectTrigger className="h-12 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl text-slate-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-xl shadow-lg">
                          <SelectItem value="Tier-1" className="focus:bg-slate-100 cursor-pointer">Tier 1 (Metro)</SelectItem>
                          <SelectItem value="Tier-2" className="focus:bg-slate-100 cursor-pointer">Tier 2 (City)</SelectItem>
                          <SelectItem value="Tier-3" className="focus:bg-slate-100 cursor-pointer">Tier 3 (District)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 group/input">
                      <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">ICU Beds</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-focus-within/input:bg-primary/20">
                          <BedDouble className="h-3 w-3 text-primary" />
                        </div>
                        <Input
                          type="number"
                          min="1"
                          max="500"
                          value={beds}
                          onChange={(e) => setBeds(e.target.value)}
                          className="pl-11 h-12 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6"></div>

                {/* Admin Section */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium text-slate-900">Admin Profile</h3>
                  </div>
                  
                  <div className="space-y-2 group/input">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-focus-within/input:bg-primary/20">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <Input
                        placeholder="Dr. Sharma"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="pl-11 h-12 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl text-slate-900 placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 group/input">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-focus-within/input:bg-primary/20">
                        <Mail className="h-3 w-3 text-primary" />
                      </div>
                      <Input
                        type="email"
                        placeholder="admin@hospital.org"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="pl-11 h-12 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl text-slate-900 placeholder:text-slate-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 group/input">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-focus-within/input:bg-primary/20">
                        <Lock className="h-3 w-3 text-primary" />
                      </div>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 h-12 text-sm bg-slate-50 border-slate-200 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl text-slate-900 placeholder:text-slate-400"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all relative overflow-hidden group" 
                    disabled={loading || cooldown > 0}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Initializing Workspace...
                      </span>
                    ) : cooldown > 0 ? (
                      `Wait ${cooldown}s before retrying`
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Complete Setup
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>

              <div className="text-center mt-8">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-300"
                >
                  Already registered? <span className="text-primary font-medium hover:underline underline-offset-4">Sign in securely</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
