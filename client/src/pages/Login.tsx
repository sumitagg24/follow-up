import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Building2,
  Bot,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

interface LoginProps {
  onSignIn: () => void;
}

export function Login({ onSignIn }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDemoLogin() {
    setLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onSignIn();
  }

  function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("This is a demo app — use \"Continue as Demo\" to sign in");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setError("Demo mode only — use \"Continue as Demo\" to sign in");
    }, 600);
  }

  return (
    <div className="min-h-screen bg-brand-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 text-white flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Subtle gradient decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-accent-400 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent-400 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white grid place-items-center font-semibold text-base backdrop-blur-sm">
              F
              <span className="absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full bg-accent-400" />
            </div>
            <div>
              <div className="font-semibold text-base">Founder Follow-Up</div>
              <div className="text-xs text-white/60">Venture Studio OS</div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-tight text-balance mb-6">
            Stay on top of every
            <br />
            founder relationship
          </h1>
          <p className="text-lg text-white/70 max-w-md leading-relaxed">
            Track ventures, manage follow-ups, and automate reminders — so no founder slips through the cracks.
          </p>

          {/* Product features */}
          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-400/20 text-accent-400 grid place-items-center shrink-0">
                <Building2 size={15} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Venture pipeline</p>
                <p className="text-xs text-white/50 mt-0.5">Track all your ventures in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-400/20 text-accent-400 grid place-items-center shrink-0">
                <Bot size={15} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Daily automation</p>
                <p className="text-xs text-white/50 mt-0.5">Automatic reminder checks at 09:00</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-400/20 text-accent-400 grid place-items-center shrink-0">
                <TrendingUp size={15} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Full activity trail</p>
                <p className="text-xs text-white/50 mt-0.5">Every action is logged and auditable</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/40">
          Demo application · No production authentication
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-brand-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-brand-900 text-white grid place-items-center font-semibold text-sm relative">
              <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-accent-400 ring-2 ring-white" />
              <span className="text-xs leading-none">F</span>
            </div>
            <div>
              <div className="font-semibold text-sm text-brand-900">Founder Follow-Up</div>
              <div className="text-xs text-brand-400">Venture Studio OS</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-brand-900 mb-1">Welcome back</h2>
            <p className="text-sm text-brand-500">Sign in to your venture studio dashboard</p>
          </div>

          {/* Email login form */}
          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
            <Input
              type="email"
              label="Email"
              placeholder="you@founderstudio.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error && !email.trim() ? "Please enter your email" : undefined}
              autoComplete="email"
            />
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-brand-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`
                    w-full rounded-xl border bg-white px-3 py-2.5 pr-10 text-sm
                    placeholder:text-brand-400
                    transition-all duration-150
                    ${error && !password ? "border-red-200 bg-red-50/50" : "border-brand-200 focus:border-brand-400 focus:ring-brand-100"}
                    text-brand-900
                  `}
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && !email.trim() && (
              <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6" /></svg>
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-brand-600 hover:text-brand-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-brand-300 text-brand-900 focus:ring-brand-500"
                />
                <span className="text-xs">Remember me</span>
              </label>
              <span className="text-accent-600 hover:text-accent-700 text-xs font-medium cursor-not-allowed opacity-50">
                Forgot password? — demo only
              </span>
            </div>

            <Button
              type="submit"
              size="lg"
              iconRight={<ArrowRight size={16} />}
              className="w-full"
              loading={loading}
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-brand-50 px-3 text-brand-400">or</span>
            </div>
          </div>

          {/* Demo CTA */}
          <div className="space-y-3">
            <Button
              onClick={handleDemoLogin}
              variant="secondary"
              size="lg"
              icon={<CheckCircle2 size={16} />}
              loading={loading}
              className="w-full"
            >
              Continue as Demo
            </Button>
            <p className="text-xs text-center text-brand-400">
              Access the full dashboard without credentials.
              <br />
              No data is saved or transmitted.
            </p>
          </div>

          {/* Footer note */}
          <div className="mt-8 p-4 bg-brand-100 rounded-xl border border-brand-200">
            <p className="text-xs text-brand-600 leading-relaxed">
              <strong className="font-medium">Prototype authentication.</strong>
              <br />
              This is a demo application. The Continue as Demo button creates a local session only — no real authentication, passwords, or user data is involved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
