import { Star, Send, MessageSquare, QrCode, BarChart3, CheckCircle, ArrowRight, Zap, Shield, TrendingUp, Users } from "lucide-react";

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ReviewBoost</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#features" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">Features</a>
          <a href="#how-it-works" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">How It Works</a>
          <a href="#pricing" className="hidden md:block text-sm text-gray-600 hover:text-gray-900">Pricing</a>
          <button onClick={onGetStarted}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md">
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute -top-20 -right-40 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" /> AI-powered review management
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
            More 5-star reviews.<br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">On autopilot.</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            ReviewBoost automatically sends review requests after every sale, generates AI responses, 
            and tracks your reputation across Google, Yelp, and more — all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onGetStarted}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-xl shadow-blue-200 transition-all text-lg">
              Start for Free <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-400">No credit card required</p>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-12 flex-wrap">
            {[
              { label: "Reviews Generated", value: "50,000+" },
              { label: "Avg Rating Increase", value: "+0.8 ⭐" },
              { label: "Response Time", value: "< 30s" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center px-6 border-r last:border-r-0 border-gray-200">
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 bg-gray-700 rounded-full h-5 mx-4 flex items-center px-3">
                <span className="text-gray-400 text-xs">reviewboost.app/dashboard</span>
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-4 gap-3">
              {[
                { label: "Total Reviews", value: "284", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
                { label: "Requests Sent", value: "1,247", icon: Send, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Avg Rating", value: "4.8", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
                { label: "Response Rate", value: "94%", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-50" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-xl p-3 shadow-sm">
                  <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
              {/* Mini review list */}
              <div className="col-span-4 bg-white rounded-xl p-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-600 mb-2">Recent Reviews</p>
                <div className="space-y-2">
                  {[
                    { name: "Sarah M.", stars: 5, text: "Absolutely amazing service! Will definitely recommend.", platform: "Google" },
                    { name: "James K.", stars: 5, text: "Best experience I've had. The team was so professional.", platform: "Yelp" },
                    { name: "Emily R.", stars: 4, text: "Great service, very friendly staff. Will come back!", platform: "Google" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold flex-shrink-0">{r.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-yellow-400 ml-1">{"★".repeat(r.stars)}</span>
                        <span className="text-gray-400 ml-1 truncate hidden sm:inline">{r.text}</span>
                      </div>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">{r.platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Everything you need to dominate<br />your local search rankings</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">One platform to collect, manage, and respond to reviews across every major platform.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Send,
                color: "from-blue-400 to-blue-600",
                title: "Automated Review Requests",
                desc: "Send personalized email and SMS requests automatically after every sale. Customizable templates for every industry."
              },
              {
                icon: Star,
                color: "from-yellow-400 to-orange-500",
                title: "AI Response Generation",
                desc: "Generate professional, on-brand responses to every review in seconds. Claude AI adapts to your tone — professional, friendly, or formal."
              },
              {
                icon: BarChart3,
                color: "from-green-400 to-emerald-600",
                title: "Sentiment Analytics",
                desc: "See exactly how customers feel. Track positive, neutral, and negative trends over time with keyword extraction."
              },
              {
                icon: QrCode,
                color: "from-purple-400 to-purple-600",
                title: "QR Code Generator",
                desc: "Create print-ready QR codes for tables, receipts, and signage. Customers scan and review in seconds — no app needed."
              },
              {
                icon: Users,
                color: "from-pink-400 to-rose-500",
                title: "Customer Database",
                desc: "Import your customers or add them manually. Bulk send review requests with one click — filtered by platform."
              },
              {
                icon: Shield,
                color: "from-indigo-400 to-indigo-600",
                title: "Multi-Platform Coverage",
                desc: "Google, Yelp, Facebook, TripAdvisor, and Trustpilot — all managed from one clean dashboard."
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Live in 5 minutes</h2>
            <p className="text-gray-500 text-lg">No complicated setup. No technical knowledge required.</p>
          </div>

          <div className="space-y-8">
            {[
              { step: "01", title: "Create your account", desc: "Sign up free and set up your business profile. Add your Google Place ID and review platform links." },
              { step: "02", title: "Add your customers", desc: "Import your customer list or add them manually. Each customer gets a personalized review request." },
              { step: "03", title: "Send review requests", desc: "Select customers and send email or SMS requests with one click. We handle timing and delivery." },
              { step: "04", title: "Watch your ratings climb", desc: "Respond to reviews with AI, track your sentiment score, and download QR codes for in-store collection." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-6 items-start">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-black text-sm">{step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
                  <p className="text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Simple, honest pricing</h2>
          <p className="text-gray-500 text-lg mb-12">Start free, upgrade when you're ready.</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                name: "Starter",
                price: "Free",
                sub: "Forever",
                features: ["Up to 50 customers", "Email review requests", "AI response generation", "QR code generator", "3 templates", "Google & Yelp integration"],
                cta: "Get Started Free",
                highlight: false,
              },
              {
                name: "Pro",
                price: "$29",
                sub: "per month",
                features: ["Unlimited customers", "Email + SMS requests", "AI response generation", "Unlimited QR codes", "Unlimited templates", "All platforms", "Priority support", "Analytics & exports"],
                cta: "Start Pro Trial",
                highlight: true,
              },
            ].map(({ name, price, sub, features, cta, highlight }) => (
              <div key={name} className={`rounded-2xl p-8 text-left border ${highlight ? "bg-gradient-to-br from-blue-600 to-purple-700 text-white border-transparent shadow-2xl shadow-blue-200" : "bg-white border-gray-200"}`}>
                <p className={`font-semibold mb-1 ${highlight ? "text-blue-200" : "text-gray-500"}`}>{name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <p className="text-4xl font-black">{price}</p>
                  <p className={`text-sm pb-1 ${highlight ? "text-blue-200" : "text-gray-400"}`}>/{sub}</p>
                </div>
                <ul className="space-y-2 my-6">
                  {features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${highlight ? "text-blue-100" : "text-gray-600"}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${highlight ? "text-blue-300" : "text-green-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${highlight ? "bg-white text-blue-700 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to get more 5-star reviews?</h2>
          <p className="text-blue-100 text-lg mb-8">Join thousands of local businesses using ReviewBoost to grow their reputation automatically.</p>
          <button onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 shadow-xl transition-all text-lg">
            Start for Free — No Card Required <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 bg-gray-900 text-gray-400 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
            <Star className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="text-white font-bold">ReviewBoost</span>
        </div>
        <p>© 2026 ReviewBoost. All rights reserved.</p>
      </footer>
    </div>
  );
}
