import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { GlobalNav } from "@/components/layout/GlobalNav";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Shield, ShieldAlert, Users, Building2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { StaffRole } from "@/hooks/useAuth";

const ROLE_BADGE: Record<string, string> = {
  attending: "bg-blue-50 text-blue-700 border-blue-200",
  nurse: "bg-emerald-50 text-emerald-700 border-emerald-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function Admin() {
  const { profile, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<StaffRole>("nurse");
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["admin_staff", profile?.hospital_id],
    enabled: !!profile?.hospital_id && profile?.role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("hospital_id", profile!.hospital_id!)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  if (loading) return null;
  if (!profile || profile.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Create auth user (simulated — in production this would use admin API)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: "TempPass123!", // Demo only
        options: { data: { full_name: newName } },
      });
      if (authError) throw authError;

      if (authData.user) {
        // Update the auto-created profile with hospital info
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            hospital_id: profile.hospital_id,
            role: newRole,
            employee_id: newEmployeeId || null,
            full_name: newName,
          })
          .eq("user_id", authData.user.id);
        if (profileError) throw profileError;
      }

      toast({ title: "Staff added", description: `${newName} has been invited as ${newRole}.` });
      queryClient.invalidateQueries({ queryKey: ["admin_staff"] });
      setOpen(false);
      setNewName("");
      setNewEmail("");
      setNewRole("nurse");
      setNewEmployeeId("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 font-sans">
      <GlobalNav />
      <main className="p-6 max-w-[1200px] mx-auto space-y-6">
        {/* ── Page Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="font-['Outfit'] text-xl font-bold text-slate-900 tracking-tight">
                Staff Management
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Building2 className="h-3 w-3 text-slate-400" />
                <p className="text-xs text-slate-500">
                  {profile.hospital_name} · {staffList?.length ?? 0} staff members
                </p>
              </div>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/10 font-medium">
                <UserPlus className="h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 shadow-2xl rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold text-slate-900">
                  Add Staff Member
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 font-medium">Full Name</Label>
                  <Input
                    placeholder="Dr. Sharma"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-sm rounded-xl border-slate-200 bg-white focus:ring-slate-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 font-medium">Email</Label>
                  <Input
                    type="email"
                    placeholder="staff@aiims.edu"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="text-sm rounded-xl border-slate-200 bg-white focus:ring-slate-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 font-medium">Role</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as StaffRole)}>
                    <SelectTrigger className="text-sm rounded-xl border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-slate-200">
                      <SelectItem value="nurse" className="text-sm focus:bg-slate-50">Nurse</SelectItem>
                      <SelectItem value="attending" className="text-sm focus:bg-slate-50">Attending</SelectItem>
                      <SelectItem value="admin" className="text-sm focus:bg-slate-50">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 font-medium">Employee ID</Label>
                  <Input
                    placeholder="EMP-001"
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    className="text-sm rounded-xl border-slate-200 bg-white focus:ring-slate-300"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full text-sm rounded-xl bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/10 font-medium"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
                  ) : (
                    "Add Staff Member"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* ── Staff Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden"
        >
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              Loading staff...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList?.map((s) => (
                  <TableRow key={s.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          s.role === "admin"
                            ? "bg-purple-50 border border-purple-200"
                            : "bg-slate-100 border border-slate-200"
                        }`}>
                          {s.role === "admin" ? (
                            <ShieldAlert className="h-3.5 w-3.5 text-purple-600" />
                          ) : (
                            <Shield className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </div>
                        {s.full_name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wide ${ROLE_BADGE[s.role] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {s.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {s.department || "ICU"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {s.employee_id || "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {(!staffList || staffList.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 text-sm py-12">
                      <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      No staff members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </motion.div>
      </main>
    </div>
  );
}
