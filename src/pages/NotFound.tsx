import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 selection:bg-blue-100 font-sans text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          className="mx-auto mb-8 bg-white border border-slate-200 shadow-xl rounded-2xl p-8 max-w-md"
        >
          {/* Icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-50 to-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
            <ShieldAlert className="h-10 w-10 text-rose-500" />
          </div>

          {/* Title */}
          <h1 className="font-['Outfit'] text-6xl font-extrabold text-slate-900 tracking-tight mb-2">
            404
          </h1>
          <p className="text-lg font-semibold text-slate-700 mb-1">Page Not Found</p>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            The route <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-200">{location.pathname}</code> does not exist in Sepsis Sentinel.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="rounded-xl bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/10 font-medium gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm gap-2">
              <Link to="/" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Subtle branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xs text-slate-400 font-mono tracking-wide mt-4"
        >
          SEPSIS SENTINEL · Clinical Intelligence Platform
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;
