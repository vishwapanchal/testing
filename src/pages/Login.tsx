import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import { useAuth } from "@/hooks/useAuth";
import SignUpForm from "@/components/auth/SignUpForm";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("demo@quantumhealth.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading, signInAsDemo } = useAuth();

  if (authLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (email === "demo@quantumhealth.com" && password === "demo123") {
        signInAsDemo();
        navigate("/dashboard");
      } else {
        toast({ title: "Error", description: "Invalid credentials. Use demo@quantumhealth.com / demo123", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset email sent", description: "Check your email for the password reset link." });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col p-4 sm:p-8 overflow-x-hidden bg-slate-50 selection:bg-primary/30">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-full px-6 transition-all duration-300 shadow-sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[440px] m-auto space-y-8 relative z-10 py-10"
      >
        {/* Logo and Header */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors duration-500" />
            <div className="relative p-4 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center">
              <Logo size={48} />
            </div>
          </motion.div>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sepsis<span className="text-blue-600 ml-1">Sentinel</span>
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.3em]">
              Precision Intelligence
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="relative group">
            <Card className="relative bg-white border border-slate-200 shadow-xl overflow-hidden rounded-[2rem]">
              <CardHeader className="pb-6 pt-8 px-6 sm:px-8">
                <CardTitle className="text-2xl font-semibold text-slate-900 text-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={showForgotPassword ? "reset" : isLogin ? "signin" : "signup"}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="block"
                    >
                      {showForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
                    </motion.span>
                  </AnimatePresence>
                </CardTitle>
                <CardDescription className="text-center text-sm text-slate-600 mt-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={showForgotPassword ? "reset-desc" : isLogin ? "signin-desc" : "signup-desc"}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="block"
                    >
                      {showForgotPassword
                        ? "Enter your email to receive a secure reset link"
                        : isLogin
                        ? "Authenticate to access the ICU monitoring grid"
                        : "Register your credentials for authorized access"}
                    </motion.span>
                  </AnimatePresence>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 space-y-6">
                <AnimatePresence mode="wait">
                  {showForgotPassword ? (
                    <motion.form
                      key="reset"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onSubmit={handleForgotPassword}
                      className="space-y-5"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="reset-email" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Email</Label>
                        <div className="relative group/input">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400 group-focus-within/input:text-primary transition-colors duration-300" />
                          </div>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="staff@hospital.org"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 bg-white border-slate-200 hover:border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900"
                            required
                          />
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-md transition-all duration-300" disabled={loading}>
                          {loading ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full h-12 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300 rounded-xl"
                          onClick={() => setShowForgotPassword(false)}
                        >
                          Back to sign in
                        </Button>
                      </motion.div>
                    </motion.form>
                  ) : isLogin ? (
                    <motion.div
                      key="login"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="space-y-5"
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300 rounded-xl text-slate-900 font-medium shadow-sm" onClick={handleGoogleLogin}>
                          <GoogleLogo className="w-4 h-4 mr-2" />
                          Continue with Google
                        </Button>
                      </motion.div>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-white px-4 text-slate-500 rounded-full text-[10px] uppercase tracking-widest font-semibold">or</span>
                        </div>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Email</Label>
                          <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="h-4 w-4 text-slate-400 group-focus-within/input:text-primary transition-colors duration-300" />
                            </div>
                            <Input
                              id="email"
                              type="email"
                              placeholder="staff@hospital.org"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 h-12 bg-white border-slate-200 hover:border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Password</Label>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-[11px] text-primary/80 hover:text-primary transition-colors font-medium"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Lock className="h-4 w-4 text-slate-400 group-focus-within/input:text-primary transition-colors duration-300" />
                            </div>
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 h-12 bg-white border-slate-200 hover:border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900"
                              minLength={6}
                              required
                            />
                          </div>
                        </div>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all duration-300" disabled={loading}>
                            {loading ? "Authenticating..." : "Sign In"}
                          </Button>
                        </motion.div>
                      </form>

                      <div className="pt-4 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsLogin(false)}
                          className="text-[11px] text-slate-600 hover:text-slate-900 transition-colors font-medium uppercase tracking-wider"
                        >
                          Need an account? <span className="text-primary hover:underline">Sign up</span>
                        </button>
                        <span className="hidden sm:inline text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => navigate("/register")}
                          className="text-[11px] text-slate-600 hover:text-slate-900 transition-colors font-medium uppercase tracking-wider"
                        >
                          Register Hospital
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <SignUpForm onSwitchToLogin={() => setIsLogin(true)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.p variants={itemVariants} className="text-center text-[10px] text-slate-500 tracking-widest uppercase font-medium">
          Access restricted to authorized ICU personnel
        </motion.p>
      </motion.div>
    </div>
  );
}
