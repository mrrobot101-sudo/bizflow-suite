import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2, Clock, LogOut } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AddTransaction from "./pages/AddTransaction";
import TransactionList from "./pages/TransactionList";
import ExportPage from "./pages/ExportPage";
import StaffPage from "./pages/StaffPage";
import AuthPage from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function Pending() {
  const { user, signOut, refreshRole } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm text-center space-y-4 bg-card border rounded-xl p-6">
        <Clock className="mx-auto text-accent" size={36} />
        <h1 className="text-xl font-heading font-bold">Waiting for approval</h1>
        <p className="text-sm text-muted-foreground">
          Your account ({user?.email}) has been created. Ask the owner to approve you on the Staff page.
        </p>
        <div className="flex gap-2">
          <button onClick={refreshRole} className="flex-1 gradient-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium">Check again</button>
          <button onClick={signOut} className="flex-1 border py-2.5 rounded-lg text-sm flex items-center justify-center gap-1"><LogOut size={14} /> Sign out</button>
        </div>
      </div>
    </div>
  );
}

function Gate() {
  const { session, role, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }
  if (!session) return <Navigate to="/auth" replace />;
  if (!role) return <Pending />;
  const owner = role === "owner";
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/add" element={<AddTransaction />} />
        <Route path="/transactions" element={<TransactionList />} />
        <Route path="/export" element={owner ? <ExportPage /> : <Navigate to="/" replace />} />
        <Route path="/staff" element={owner ? <StaffPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/*" element={<Gate />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
