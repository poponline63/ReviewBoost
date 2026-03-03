import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Star, Send, Settings, Users, BarChart3, MessageSquare,
  Plus, Trash2, QrCode, RefreshCw, Copy, CheckCircle,
  TrendingUp, Mail, Smile, Frown, Meh, LogOut, FileText, Download
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

type Tab = "dashboard" | "responses" | "send" | "templates" | "qrcodes" | "settings";

// ── Small helpers ───────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))}
    </span>
  );
}

function Badge({ label, variant = "gray" }: { label: string; variant?: "green" | "red" | "yellow" | "gray" | "blue" }) {
  const cls = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-700",
  }[variant];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

// ── Dashboard Tab ───────────────────────────────────────────
function DashboardTab() {
  const { data: stats } = useQuery<any>({ queryKey: ["/api/stats"] });
  const { data: reviews = [] } = useQuery<any[]>({ queryKey: ["/api/reviews"] });

  const recentReviews = reviews.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: stats?.totalReviews ?? 0, icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
          { label: "Requests Sent", value: stats?.totalRequests ?? 0, icon: Send, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Avg Rating", value: stats?.avgRating ?? "—", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
          { label: "Response Rate", value: `${stats?.responseRate ?? 0}%`, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Sentiment breakdown */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Sentiment Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Positive", value: stats.positiveReviews, icon: Smile, color: "text-green-500", bg: "bg-green-50" },
              { label: "Neutral", value: stats.neutralReviews, icon: Meh, color: "text-yellow-500", bg: "bg-yellow-50" },
              { label: "Negative", value: stats.negativeReviews, icon: Frown, color: "text-red-500", bg: "bg-red-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                <Icon className={`w-7 h-7 ${color} mx-auto mb-1`} />
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent reviews */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
        {recentReviews.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No reviews yet. Add some to get started!</p>
        ) : (
          <div className="space-y-3">
            {recentReviews.map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-blue-700">
                  {r.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{r.customerName}</span>
                    <StarRating rating={r.rating} />
                    <Badge label={r.platform} variant="blue" />
                    {r.responded && <Badge label="Responded" variant="green" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Response Board Tab ──────────────────────────────────────
function ResponsesTab() {
  const { data: reviews = [], refetch } = useQuery<any[]>({ queryKey: ["/api/reviews"] });
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [generatedResponses, setGeneratedResponses] = useState<Record<number, string>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newReview, setNewReview] = useState({ customerName: "", rating: "5", text: "", platform: "Google", reviewDate: "" });

  async function generateResponse(reviewId: number) {
    setGeneratingId(reviewId);
    try {
      const res = await apiRequest("POST", `/api/reviews/${reviewId}/generate-response`, {});
      const data = await res.json();
      setGeneratedResponses(p => ({ ...p, [reviewId]: data.response }));
    } catch (e) { console.error(e); }
    finally { setGeneratingId(null); }
  }

  async function saveResponse(reviewId: number) {
    const response = generatedResponses[reviewId];
    if (!response) return;
    await apiRequest("PATCH", `/api/reviews/${reviewId}/respond`, { response });
    queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
  }

  async function copyResponse(reviewId: number) {
    const r = generatedResponses[reviewId];
    if (r) { await navigator.clipboard.writeText(r); setCopiedId(reviewId); setTimeout(() => setCopiedId(null), 2000); }
  }

  async function addReview() {
    await apiRequest("POST", "/api/reviews", { ...newReview, rating: Number(newReview.rating), reviewDate: newReview.reviewDate || new Date().toISOString().split("T")[0] });
    queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    setNewReview({ customerName: "", rating: "5", text: "", platform: "Google", reviewDate: "" });
    setAddOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Review Response Board</h2>
        <button onClick={() => setAddOpen(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Review
        </button>
      </div>

      {addOpen && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-blue-900">Add New Review</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Customer Name" value={newReview.customerName} onChange={e => setNewReview(p => ({...p, customerName: e.target.value}))} />
            <select className="border rounded-lg px-3 py-2 text-sm" value={newReview.rating} onChange={e => setNewReview(p => ({...p, rating: e.target.value}))}>
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm" value={newReview.platform} onChange={e => setNewReview(p => ({...p, platform: e.target.value}))}>
              {["Google","Yelp","Facebook","TripAdvisor","Trustpilot"].map(p => <option key={p}>{p}</option>)}
            </select>
            <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={newReview.reviewDate} onChange={e => setNewReview(p => ({...p, reviewDate: e.target.value}))} />
          </div>
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Review text…" value={newReview.text} onChange={e => setNewReview(p => ({...p, text: e.target.value}))} />
          <div className="flex gap-2">
            <button onClick={addReview} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Save Review</button>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 bg-white border text-sm rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No reviews yet. Add your first review above.</p>
        </div>
      ) : (
        reviews.map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {r.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{r.customerName}</span>
                    <StarRating rating={r.rating} />
                    <Badge label={r.platform} variant="blue" />
                    <Badge label={r.sentiment} variant={r.sentiment === "positive" ? "green" : r.sentiment === "negative" ? "red" : "yellow"} />
                    {r.responded && <Badge label="Responded ✓" variant="green" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.reviewDate}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{r.text}</p>

            {r.responded && r.response && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-medium text-green-700 mb-1">Your Response:</p>
                <p className="text-sm text-green-800">{r.response}</p>
              </div>
            )}

            {generatedResponses[r.id] && !r.responded && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-blue-700">AI Generated Response:</p>
                <textarea
                  className="w-full text-sm bg-transparent border-none outline-none text-blue-800 resize-none"
                  rows={4}
                  value={generatedResponses[r.id]}
                  onChange={e => setGeneratedResponses(p => ({...p, [r.id]: e.target.value}))}
                />
                <div className="flex gap-2">
                  <button onClick={() => saveResponse(r.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                    <CheckCircle className="w-3.5 h-3.5" /> Save Response
                  </button>
                  <button onClick={() => copyResponse(r.id)} className="flex items-center gap-1 px-3 py-1.5 bg-white border text-xs rounded-lg hover:bg-gray-50">
                    {copiedId === r.id ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === r.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {!r.responded && (
              <button
                onClick={() => generateResponse(r.id)}
                disabled={generatingId === r.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-60"
              >
                {generatingId === r.id ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Star className="w-3.5 h-3.5" /> Generate Response</>}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ── Send Requests Tab ───────────────────────────────────────
function SendTab() {
  const { data: customers = [] } = useQuery<any[]>({ queryKey: ["/api/customers"] });
  const { data: requests = [] } = useQuery<any[]>({ queryKey: ["/api/requests"] });
  const [selected, setSelected] = useState<number[]>([]);
  const [method, setMethod] = useState("email");
  const [platform, setPlatform] = useState("Google");
  const [newCust, setNewCust] = useState({ name: "", email: "", phone: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function addCustomer() {
    if (!newCust.name) return;
    await apiRequest("POST", "/api/customers", newCust);
    queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    setNewCust({ name: "", email: "", phone: "" });
  }

  async function deleteCustomer(id: number) {
    await apiRequest("DELETE", `/api/customers/${id}`);
    queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    setSelected(p => p.filter(s => s !== id));
  }

  async function sendRequests() {
    if (!selected.length) return;
    setSending(true);
    try {
      await apiRequest("POST", "/api/requests/send", { customerIds: selected, method, platform });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      setSent(true);
      setSelected([]);
      setTimeout(() => setSent(false), 3000);
    } finally { setSending(false); }
  }

  function toggleSelect(id: number) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  return (
    <div className="space-y-6">
      {/* Add customer */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Add Customer</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Full Name *" value={newCust.name} onChange={e => setNewCust(p => ({...p, name: e.target.value}))} />
          <input type="email" className="border rounded-lg px-3 py-2 text-sm" placeholder="Email" value={newCust.email} onChange={e => setNewCust(p => ({...p, email: e.target.value}))} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Phone" value={newCust.phone} onChange={e => setNewCust(p => ({...p, phone: e.target.value}))} />
        </div>
        <button onClick={addCustomer} disabled={!newCust.name} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Customer list */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-semibold text-gray-900">Customers ({customers.length})</h3>
          <div className="flex items-center gap-3">
            <select className="border rounded-lg px-2 py-1.5 text-sm" value={method} onChange={e => setMethod(e.target.value)}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="both">Email + SMS</option>
            </select>
            <select className="border rounded-lg px-2 py-1.5 text-sm" value={platform} onChange={e => setPlatform(e.target.value)}>
              {["Google","Yelp","Facebook","TripAdvisor","Trustpilot"].map(p => <option key={p}>{p}</option>)}
            </select>
            <button onClick={sendRequests} disabled={!selected.length || sending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
              {sending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending…</> : sent ? <><CheckCircle className="w-3.5 h-3.5" /> Sent!</> : <><Send className="w-3.5 h-3.5" /> Send to {selected.length}</>}
            </button>
          </div>
        </div>
        {customers.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No customers yet. Add one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="w-10 p-3 text-center"><input type="checkbox" checked={selected.length === customers.length && customers.length > 0} onChange={e => setSelected(e.target.checked ? customers.map((c: any) => c.id) : [])} /></th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left hidden md:table-cell">Email</th>
                <th className="p-3 text-left hidden md:table-cell">Phone</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3 text-center"><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-gray-500 hidden md:table-cell">{c.email ?? "—"}</td>
                  <td className="p-3 text-gray-500 hidden md:table-cell">{c.phone ?? "—"}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => deleteCustomer(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sent requests */}
      {requests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Sent Requests</h3>
          <div className="space-y-2">
            {requests.slice(0, 10).map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium flex-shrink-0">
                  {r.customerName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{r.customerName}</p>
                  <p className="text-xs text-gray-400">{r.customerEmail ?? r.customerPhone ?? "No contact"}</p>
                </div>
                <Badge label={r.method} variant="blue" />
                <Badge label={r.status} variant={r.status === "sent" ? "green" : "gray"} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Templates Tab ───────────────────────────────────────────
function TemplatesTab() {
  const { data: templates = [] } = useQuery<any[]>({ queryKey: ["/api/templates"] });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", category: "General", emailSubject: "", emailBody: "", smsBody: "" });

  async function save() {
    if (editing) {
      await apiRequest("PATCH", `/api/templates/${editing.id}`, form);
    } else {
      await apiRequest("POST", "/api/templates", form);
    }
    queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    setCreating(false);
    setEditing(null);
    setForm({ name: "", category: "General", emailSubject: "", emailBody: "", smsBody: "" });
  }

  async function setDefault(id: number) {
    await apiRequest("POST", `/api/templates/${id}/set-default`, {});
    queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
  }

  async function deleteTemplate(id: number) {
    await apiRequest("DELETE", `/api/templates/${id}`);
    queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
  }

  function startEdit(t: any) {
    setEditing(t);
    setForm({ name: t.name, category: t.category, emailSubject: t.emailSubject, emailBody: t.emailBody, smsBody: t.smsBody ?? "" });
    setCreating(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Email & SMS Templates</h2>
        <button onClick={() => { setCreating(v => !v); setEditing(null); setForm({ name: "", category: "General", emailSubject: "", emailBody: "", smsBody: "" }); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {creating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <h3 className="font-medium text-blue-900">{editing ? "Edit Template" : "New Template"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm col-span-2 md:col-span-1" placeholder="Template Name *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
            <select className="border rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}>
              {["General","Restaurant","Professional Services","E-commerce","Healthcare","Automotive","Other"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input className="border rounded-lg px-3 py-2 text-sm w-full" placeholder="Email Subject" value={form.emailSubject} onChange={e => setForm(p => ({...p, emailSubject: e.target.value}))} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Email Body — use {'{name}'}, {'{business}'}, {'{link}'} as placeholders</p>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={6} placeholder="Hi {name},…" value={form.emailBody} onChange={e => setForm(p => ({...p, emailBody: e.target.value}))} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">SMS Body (optional)</p>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.smsBody} onChange={e => setForm(p => ({...p, smsBody: e.target.value}))} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={!form.name} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">Save Template</button>
            <button onClick={() => { setCreating(false); setEditing(null); }} className="px-4 py-2 bg-white border text-sm rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {templates.length === 0 && !creating ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No templates yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{t.name}</span>
                    {t.isDefault && <Badge label="Default" variant="green" />}
                    <Badge label={t.category} variant="gray" />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{t.emailSubject}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><RefreshCw className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-3 bg-gray-50 rounded-lg p-2">{t.emailBody}</p>
              {!t.isDefault && (
                <button onClick={() => setDefault(t.id)} className="text-xs text-blue-600 hover:underline">Set as Default</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── QR Codes Tab ─────────────────────────────────────────────
function QrCodesTab() {
  const { data: codes = [] } = useQuery<any[]>({ queryKey: ["/api/qrcodes"] });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", platform: "Google", style: "standard", size: "medium", includeText: true, customText: "Scan to Review Us!" });
  const [previewUrl, setPreviewUrl] = useState<Record<number,string>>({});

  async function create() {
    await apiRequest("POST", "/api/qrcodes", form);
    queryClient.invalidateQueries({ queryKey: ["/api/qrcodes"] });
    setCreating(false);
  }

  async function deleteCode(id: number) {
    await apiRequest("DELETE", `/api/qrcodes/${id}`);
    queryClient.invalidateQueries({ queryKey: ["/api/qrcodes"] });
  }

  async function downloadQR(id: number, name: string) {
    const res = await fetch(`/api/qrcodes/${id}/image`, { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}-qr.png`; a.click();
    URL.revokeObjectURL(url);
  }

  async function previewQR(id: number) {
    const res = await fetch(`/api/qrcodes/${id}/image`, { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setPreviewUrl(p => ({ ...p, [id]: url }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">QR Code Generator</h2>
        <button onClick={() => setCreating(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New QR Code
        </button>
      </div>

      {creating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <h3 className="font-medium text-blue-900">Create QR Code</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2 text-sm col-span-2 md:col-span-1" placeholder="QR Code Name *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
            <select className="border rounded-lg px-3 py-2 text-sm" value={form.platform} onChange={e => setForm(p => ({...p, platform: e.target.value}))}>
              {["Google","Yelp","Facebook","TripAdvisor","Trustpilot"].map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 text-sm" value={form.size} onChange={e => setForm(p => ({...p, size: e.target.value}))}>
              {["small","medium","large","xlarge"].map(s => <option key={s}>{s}</option>)}
            </select>
            <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Custom Text" value={form.customText} onChange={e => setForm(p => ({...p, customText: e.target.value}))} />
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={!form.name} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">Generate QR Code</button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 bg-white border text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {codes.length === 0 && !creating ? (
        <div className="text-center py-16 text-gray-400">
          <QrCode className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No QR codes yet. Create one to place in your business!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((q: any) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{q.name}</p>
                  <p className="text-xs text-gray-400">{q.platform} · {q.size}</p>
                </div>
                <button onClick={() => deleteCode(q.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              {previewUrl[q.id] && (
                <img src={previewUrl[q.id]} alt="QR" className="w-32 h-32 mx-auto rounded-lg border" />
              )}
              <div className="flex gap-2 text-sm">
                <span className="text-gray-500">{q.scans} scans</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">{q.reviews} reviews</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => previewQR(q.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 border text-xs rounded-lg hover:bg-gray-50">
                  <QrCode className="w-3.5 h-3.5" /> Preview
                </button>
                <button onClick={() => downloadQR(q.id, q.name)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ─────────────────────────────────────────────
function SettingsTab() {
  const { data: biz } = useQuery<any>({ queryKey: ["/api/business"] });
  const [form, setForm] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  if (biz && !form) setForm(biz);

  async function save() {
    await apiRequest("PATCH", "/api/business", form);
    queryClient.invalidateQueries({ queryKey: ["/api/business"] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!form) return <div className="text-center py-16 text-gray-400">Loading settings…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900">Business Settings</h2>

      {/* Business Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-800">Business Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.name ?? ""} onChange={e => setForm((p: any) => ({...p, name: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={form.description ?? ""} onChange={e => setForm((p: any) => ({...p, description: e.target.value}))} />
          </div>
        </div>
      </div>

      {/* Platform URLs */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-800">Review Platform Links</h3>
        {[
          { key: "googlePlaceId", label: "Google Place ID", placeholder: "ChIJ..." },
          { key: "yelpUrl", label: "Yelp URL", placeholder: "https://yelp.com/biz/..." },
          { key: "facebookUrl", label: "Facebook URL", placeholder: "https://facebook.com/..." },
          { key: "trustpilotUrl", label: "Trustpilot URL", placeholder: "https://trustpilot.com/review/..." },
          { key: "tripadvisorUrl", label: "TripAdvisor URL", placeholder: "https://tripadvisor.com/..." },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={placeholder} value={form[key] ?? ""} onChange={e => setForm((p: any) => ({...p, [key]: e.target.value}))} />
          </div>
        ))}
      </div>

      {/* Request Settings */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-800">Request Settings</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Delivery Method</label>
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.deliveryMethod ?? "email"} onChange={e => setForm((p: any) => ({...p, deliveryMethod: e.target.value}))}>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
          <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.emailSubject ?? ""} onChange={e => setForm((p: any) => ({...p, emailSubject: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMS Template</label>
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.smsTemplate ?? ""} onChange={e => setForm((p: any) => ({...p, smsTemplate: e.target.value}))} />
          <p className="text-xs text-gray-400 mt-1">Use {'{name}'}, {'{business}'}, {'{link}'} as placeholders</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">AI Response Style</label>
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.responseStyle ?? "professional"} onChange={e => setForm((p: any) => ({...p, responseStyle: e.target.value}))}>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
          </select>
        </div>
      </div>

      <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
        {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : "Save Settings"}
      </button>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { user, logoutMutation } = useAuth();

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "responses", label: "Responses", icon: MessageSquare },
    { id: "send", label: "Send Requests", icon: Send },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "qrcodes", label: "QR Codes", icon: QrCode },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ReviewBoost</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.username}</span>
          <button onClick={() => logoutMutation.mutate()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 py-4 px-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors ${activeTab === id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
          {tabs.map(({ id, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs ${activeTab === id ? "text-blue-600" : "text-gray-400"}`}>
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 max-w-5xl">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "responses" && <ResponsesTab />}
          {activeTab === "send" && <SendTab />}
          {activeTab === "templates" && <TemplatesTab />}
          {activeTab === "qrcodes" && <QrCodesTab />}
          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}
