import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Building2, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("ICU");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("nurse");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !employeeId.trim()) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, department, employee_id: employeeId, role },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast({
        title: "Account created",
        description: "Check your email to verify your account.",
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form 
      variants={formVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSignUp} 
      className="space-y-5"
    >
      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="name" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Full Name *</Label>
        <div className="relative group/input">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-slate-400 group-focus-within/input:text-primary transition-colors duration-300" />
          </div>
          <Input
            id="name"
            placeholder="Dr. Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 hover:border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900"
            required
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="signup-email" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Email *</Label>
        <div className="relative group/input">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-slate-400 group-focus-within/input:text-primary transition-colors duration-300" />
          </div>
          <Input
            id="signup-email"
            type="email"
            placeholder="staff@hospital.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 hover:border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900"
            required
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="signup-password" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Password *</Label>
        <div className="relative group/input">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-slate-400 group-focus-within/input:text-primary transition-colors duration-300" />
          </div>
          <Input
            id="signup-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 hover:border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900"
            minLength={6}
            required
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-2">
        <Label htmlFor="employee-id" className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Employee ID *</Label>
        <div className="relative group/input">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BadgeCheck className="h-4 w-4 text-slate-400 group-focus-within/input:text-primary transition-colors duration-300" />
          </div>
          <Input
            id="employee-id"
            placeholder="EMP-001"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 hover:border-slate-300 focus-visible:border-primary focus-visible:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900"
            required
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-11 bg-white border-slate-200 hover:border-slate-300 focus:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900">
              <Building2 className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl shadow-lg">
              <SelectItem value="ICU">ICU</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
              <SelectItem value="Surgery">Surgery</SelectItem>
              <SelectItem value="Internal Medicine">Internal Med</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-11 bg-white border-slate-200 hover:border-slate-300 focus:ring-primary/20 transition-all duration-300 rounded-xl text-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-xl shadow-lg">
              <SelectItem value="nurse">Nurse</SelectItem>
              <SelectItem value="attending">Attending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
        <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-md transition-all duration-300" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="text-center pt-2">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[11px] text-slate-600 hover:text-slate-900 transition-colors font-medium uppercase tracking-wider"
        >
          Already have an account? <span className="text-primary hover:underline">Sign in</span>
        </button>
      </motion.div>
    </motion.form>
  );
}
