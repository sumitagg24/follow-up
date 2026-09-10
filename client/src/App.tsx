import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ToastProvider } from "./components/Toast";
import { Dashboard } from "./pages/Dashboard";
import { Ventures } from "./pages/Ventures";
import { VentureForm } from "./pages/VentureForm";
import { VentureDetails } from "./pages/VentureDetails";
import { ActivityLog } from "./pages/ActivityLog";
import { Tasks } from "./pages/Tasks";
import { Automation } from "./pages/Automation";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
          <Sidebar/>
          <main className="flex-1 min-w-0">
            {/* header spacer for mobile */}
            <div className="h-12 lg:hidden"/>
            <Routes>
              <Route path="/" element={<Dashboard/>}/>
              <Route path="/ventures" element={<Ventures/>}/>
              <Route path="/ventures/new" element={<VentureForm/>}/>
              <Route path="/ventures/:id/edit" element={<VentureForm/>}/>
              <Route path="/ventures/:id" element={<VentureDetails/>}/>
              <Route path="/tasks" element={<Tasks/>}/>
              <Route path="/automation" element={<Automation/>}/>
              <Route path="/activity" element={<ActivityLog/>}/>
              <Route path="/analytics" element={<Analytics/>}/>
              <Route path="/settings" element={<Settings/>}/>
              <Route path="*" element={<NotFound/>}/>
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
