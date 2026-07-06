import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/login");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-8 relative overflow-x-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md m-auto py-10"
        >
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xl overflow-hidden relative">
            
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Invalid Link</h2>
                <p className="text-sm text-slate-600">
                  This reset link has expired or is invalid. Please request a new one.
                </p>
              </div>
              <Button 
                className="w-full bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 h-11 rounded-xl"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-8 relative overflow-x-hidden selection:bg-blue-100">

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md m-auto relative z-10 py-10"
      >
        {/* Brand Header */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 mb-8">
          <div className="relative group">
            <div className="relative p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
              <Logo size={48} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sepsis<span className="text-blue-600 ml-1">Sentinel</span>
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em]">
              Reset Password
            </p>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={itemVariants} className="relative group/card">
          <div className="relative bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xl overflow-hidden">
            
            <form onSubmit={handleResetPassword} className="space-y-6 relative z-10">
              
              <motion.div variants={itemVariants} className="space-y-2.5">
                <Label htmlFor="new-password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  New Password
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within/input:text-blue-600 transition-colors duration-300" />
                  </div>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl transition-all duration-300"
                    placeholder="Enter new password"
                    minLength={6}
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2.5">
                <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Confirm Password
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Shield className="h-4 w-4 text-slate-400 group-focus-within/input:text-purple-600 transition-colors duration-300" />
                  </div>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 bg-white border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 text-slate-900 placeholder:text-slate-400 rounded-xl transition-all duration-300"
                    placeholder="Confirm new password"
                    minLength={6}
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 border-0 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Update Password
                      <ArrowRight className="h-4 w-4 opacity-70 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all duration-300" />
                    </>
                  )}
                </Button>
              </motion.div>

            </form>
          </div>
        </motion.div>
        
        {/* Footer Text */}
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Secured by advanced encryption • Sepsis Sentinel
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
