import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight, Building2, Bot, TrendingUp } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { api, storeToken } from "../api/client";
import { usePageTitle } from "../hooks/usePageTitle";

interface SignupProps {
  onSignIn: (token: string, user: { name: string; email: string }, remember: boolean) => void;
}

export function Signup({ onSignIn }: SignupProps) {
  usePageTitle("Create account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Please enter your name";
    if (!email.trim()) errors.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address";
    if (!password) errors.password = "Please choose a password";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters";
    if (confirm !== password) errors.confirm = "Passwords do not match";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const { token, user } = await api.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      storeToken(token, true);
      onSignIn(token, { name: user.name, email: user.email }, true);
    } catch (err: any) {
      // Surface validation details from the API when present
      if (err.details?.length) setFormError(err.details.join(" · "));
      else setFormError(err.message || "Unable to create account — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Slaky-style top bar */}
      <header className="bg-white/85 backdrop-blur-md border-b border-brand-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-[57px] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-900 text-white grid place-items-center font-bold text-[13px] shrink-0">
            F
          </div>
          <div className="leading-none">
            <div className="font-bold text-[14px] text-brand-900 tracking-tight">Follow-Up</div>
            <div className="text-[11px] text-brand-400 mt-0.5">Venture Studio OS</div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[13px]">
            <span className="hidden sm:inline text-brand-400">Have an account?</span>
            <Link
              to="/login"
              className="px-4 py-2 rounded-full bg-brand-900 font-semibold text-white hover:bg-brand-800 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-[11px] font-semibold text-brand-600 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Set up in under a minute
            </p>
            <h1 className="text-3xl font-bold text-brand-900 tracking-tightest">Create your account</h1>
            <p className="text-sm text-brand-500 mt-2">Start tracking ventures, follow-ups, and reminders.</p>
          </div>

          <div className="slaky-card p-6 sm:p-7">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Full name"
                placeholder="Jane Operator"
                icon={<UserIcon size={16} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                autoComplete="name"
                autoFocus
              />

              <Input
                type="email"
                label="Work email"
                placeholder="you@founderstudio.com"
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                autoComplete="email"
              />

              <Input
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="At least 8 characters"
                hint="Use 8+ characters — a mix of letters, numbers, and symbols is best."
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
                autoComplete="new-password"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-brand-400 hover:text-brand-900 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <Input
                type={showPassword ? "text" : "password"}
                label="Confirm password"
                placeholder="Re-enter your password"
                icon={<Lock size={16} />}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={fieldErrors.confirm}
                autoComplete="new-password"
              />

              {formError && (
                <p
                  className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <Button type="submit" size="lg" iconRight={<ArrowRight size={16} />} className="w-full" loading={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </div>

          {/* Feature strip */}
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {[
              { icon: Building2, t: "Pipeline", d: "All ventures" },
              { icon: Bot, t: "09:00 check", d: "Auto reminders" },
              { icon: TrendingUp, t: "Feed", d: "Full audit trail" },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-brand-200 bg-white px-3 py-3 text-center">
                <f.icon size={15} className="mx-auto text-brand-700" />
                <p className="text-xs font-bold text-brand-900 tracking-tight mt-1.5">{f.t}</p>
                <p className="text-[11px] text-brand-400">{f.d}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-center text-brand-400">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-900 hover:text-brand-600 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <footer className="border-t border-brand-200 bg-white">
        <p className="max-w-6xl mx-auto px-4 py-4 text-center text-[11px] text-brand-400">
          © {new Date().getFullYear()} Follow-Up — Directory · Leaderboard · Feed · Automation
        </p>
      </footer>
    </div>
  );
}
