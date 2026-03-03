import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Star, BarChart3, MessageSquare, QrCode } from "lucide-react";

export default function AuthPage({ onBack }: { onBack?: () => void }) {
  const { loginMutation, registerMutation } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (tab === "login") {
        await loginMutation.mutateAsync({ username: form.username, password: form.password });
      } else {
        await registerMutation.mutateAsync({ username: form.username, password: form.password, email: form.email });
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    }
  }

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ReviewBoost</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-gray-500 mb-6">
            {tab === "login" ? "Sign in to manage your reviews" : "Start collecting more reviews today"}
          </p>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            {(["login", "register"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text" required value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="yourbusiness"
              />
            </div>

            {tab === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@business.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={isPending}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all">
              {isPending ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}
              className="text-blue-600 hover:underline font-medium">
              {tab === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* Right — Feature highlights */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-700 items-center justify-center p-12">
        <div className="text-white max-w-md">
          <h2 className="text-3xl font-bold mb-3">Grow your reputation on autopilot</h2>
          <p className="text-blue-100 mb-10">Send review requests after every sale, respond with AI, and watch your rating climb.</p>
          <div className="space-y-5">
            {[
              { icon: MessageSquare, title: "Automated Review Requests", desc: "Send email or SMS requests after every sale automatically" },
              { icon: Star, title: "AI-Powered Responses", desc: "Generate professional responses to every review in seconds" },
              { icon: BarChart3, title: "Sentiment Analytics", desc: "Understand customer sentiment across all platforms" },
              { icon: QrCode, title: "QR Code Generator", desc: "Create QR codes for in-store review collection" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-blue-100 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
