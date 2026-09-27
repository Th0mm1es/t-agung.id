"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { formatCurrency, type City, type Country } from "@bandinghidup/core";

export function ProposalsAdminClient() {
  const { locale } = useI18n();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"pending" | "community" | "approved" | "create">("pending");
  const [filterCountry, setFilterCountry] = useState<string>("ALL");

  // Form state for Manual Proposal Creator
  const [formCityId, setFormCityId] = useState("");
  const [formCategory, setFormCategory] = useState("housing");
  const [formCurrency, setFormCurrency] = useState<"EUR" | "JPY" | "IDR">("EUR");
  const [formProposedMajor, setFormProposedMajor] = useState("520");
  const [formConfidence, setFormConfidence] = useState(0.85);
  const [formRationale, setFormRationale] = useState("Manual test submission via Admin Portal");
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Fetch Countries
  const { data: countries } = useQuery<Country[]>({
    queryKey: ["admin-countries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("countries").select("*");
      if (error) throw error;
      return data as Country[];
    },
  });

  // Fetch Cities
  const { data: cities } = useQuery<City[]>({
    queryKey: ["admin-cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").order("name");
      if (error) throw error;
      return data as City[];
    },
  });

  // Fetch Proposals from API
  const { data: proposals, isLoading: proposalsLoading, refetch: refetchProposals } = useQuery({
    queryKey: ["proposals-list", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/proposals?status=${activeTab === "approved" ? "approved" : activeTab === "pending" ? "pending" : "all"}`);
      if (!res.ok) throw new Error("Failed to fetch proposals");
      const json = await res.json();
      return json.proposals as any[];
    },
  });

  // Fetch Community Observations from API
  const { data: observations, isLoading: observationsLoading, refetch: refetchObservations } = useQuery({
    queryKey: ["community-observations"],
    queryFn: async () => {
      const res = await fetch("/api/community/observe?status=pending_moderation");
      if (!res.ok) throw new Error("Failed to fetch observations");
      const json = await res.json();
      return json.observations as any[];
    },
    enabled: activeTab === "community",
  });

  // Mutation for Approve/Reject Action
  const actionMutation = useMutation({
    mutationFn: async ({ proposalId, action }: { proposalId: string; action: "approve" | "reject" }) => {
      const res = await fetch("/api/proposals/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId, action }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed action");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
      refetchProposals();
    },
  });

  // Submit Manual Proposal
  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    setSubmitSuccess(null);
    try {
      const minor = formCurrency === "EUR" ? BigInt(Math.round(parseFloat(formProposedMajor) * 100)) : BigInt(Math.round(parseFloat(formProposedMajor)));

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-role-key": "dev-service-role-key-secret",
        },
        body: JSON.stringify({
          source_code: "hermes_agent",
          city_id: formCityId,
          category_code: formCategory,
          proposed_value_minor_units: minor.toString(),
          currency_code: formCurrency,
          confidence_score: formConfidence,
          source_url: "https://destatis.de",
          rationale: formRationale,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }

      setSubmitSuccess("Proposal created successfully in staging queue!");
      refetchProposals();
      setActiveTab("pending");
    } catch (err: any) {
      alert(`Error creating proposal: ${err.message}`);
    }
  }

  const filteredProposals = proposals?.filter((p) => {
    if (filterCountry === "ALL") return true;
    const co = countries?.find((c) => c.id === p.cities?.country_id);
    const country = co?.code || "JP";
    return country === filterCountry;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge-brand text-xs">🛡️ Data Governance</span>
            <span className="text-xs text-fg-soft font-mono">Stage 2 & Stage 3 Pipeline</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-[var(--text)] mt-1">
            Admin Proposal & Community Portal
          </h1>
          <p className="text-sm text-fg-muted">
            Review scraped data proposals and anonymous community price observations.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("create")}
          className="btn-primary text-sm px-4 py-2.5 flex items-center gap-2"
        >
          <span>➕</span>
          <span>Submit Proposal</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-line text-sm gap-6 flex-wrap">
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 font-medium transition-all ${
            activeTab === "pending"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-fg-muted hover:text-[var(--text)]"
          }`}
        >
          ⏳ Pending Proposals {proposals && activeTab === "pending" && `(${filteredProposals?.length ?? 0})`}
        </button>

        <button
          onClick={() => setActiveTab("community")}
          className={`pb-3 font-medium transition-all ${
            activeTab === "community"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-fg-muted hover:text-[var(--text)]"
          }`}
        >
          💬 Community Moderation
        </button>

        <button
          onClick={() => setActiveTab("approved")}
          className={`pb-3 font-medium transition-all ${
            activeTab === "approved"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-fg-muted hover:text-[var(--text)]"
          }`}
        >
          ✅ Approved History
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`pb-3 font-medium transition-all ${
            activeTab === "create"
              ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-bold"
              : "text-fg-muted hover:text-[var(--text)]"
          }`}
        >
          🧪 Proposal Creator
        </button>
      </div>

      {/* Filter Row */}
      {activeTab !== "create" && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-fg-muted text-xs">Filter Country:</span>
            {(["ALL", "DE", "JP", "ID"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilterCountry(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterCountry === c
                    ? "bg-[var(--accent)] text-white"
                    : "bg-panel-2 text-fg-60 hover:text-[var(--text)]"
                }`}
              >
                {c === "DE" ? "🇩🇪 Germany" : c === "JP" ? "🇯🇵 Japan" : c === "ID" ? "🇮🇩 Indonesia" : "All Countries"}
              </button>
            ))}
          </div>

          <span className="text-xs text-fg-soft">
            Strict Proposal-Only Ingestion Active
          </span>
        </div>
      )}

      {/* Tab 1 & Approved: Proposal Cards */}
      {(activeTab === "pending" || activeTab === "approved") && (
        <div className="space-y-4">
          {proposalsLoading ? (
            <div className="py-12 text-center text-fg-muted text-sm">Loading proposals from staging table...</div>
          ) : filteredProposals && filteredProposals.length > 0 ? (
            filteredProposals.map((p) => {
              const delta = p.percentage_delta_vs_current;
              const isLargeDelta = delta && Math.abs(delta) > 20;

              return (
                <div
                  key={p.id}
                  className="glass-card p-5 space-y-4 transition-all hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[var(--text)] text-base">
                          {p.cities?.name ?? "City"}
                        </span>
                        <span className="badge-brand text-xs uppercase">
                          {p.category_code}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-panel-2 text-fg-60">
                          {p.data_sources?.name ?? "Source"} (Tier {p.data_sources?.source_tier ?? 1})
                        </span>
                      </div>

                      <p className="text-xs text-fg-soft mt-1">
                        Submitted: {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                        p.status === "pending"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : p.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 rounded-xl bg-panel-2 border border-line text-sm">
                    <div>
                      <div className="text-xs text-fg-muted">Proposed Price</div>
                      <div className="font-mono font-bold text-gradient-brand text-lg">
                        {formatCurrency(BigInt(p.proposed_value_minor_units), p.currency_code, locale === "id" ? "id-ID" : "en-US")}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-fg-muted">Percentage Delta</div>
                      <div className="font-mono font-semibold">
                        {delta !== null ? (
                          <span className={isLargeDelta ? "text-amber-400 font-bold" : "text-fg-80"}>
                            {delta > 0 ? `+${delta}%` : `${delta}%`}
                          </span>
                        ) : (
                          <span className="text-fg-soft">New Benchmark</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-fg-muted">Confidence Score</div>
                      <div className="font-mono text-fg-80 font-medium">
                        {(p.confidence_score * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-fg-muted">Currency</div>
                      <div className="font-mono text-fg-80">{p.currency_code}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-fg-70">
                    <p className="leading-relaxed">
                      <span className="font-semibold text-fg-muted">Rationale: </span>
                      {p.rationale}
                    </p>
                  </div>

                  {p.status === "pending" && (
                    <div className="flex gap-3 pt-2 border-t border-line">
                      <button
                        onClick={() => actionMutation.mutate({ proposalId: p.id, action: "approve" })}
                        disabled={actionMutation.isPending}
                        className="btn-primary text-xs py-2 px-4 flex-1"
                      >
                        {actionMutation.isPending ? "Updating..." : "✓ Approve & Publish to Benchmark"}
                      </button>

                      <button
                        onClick={() => actionMutation.mutate({ proposalId: p.id, action: "reject" })}
                        disabled={actionMutation.isPending}
                        className="btn-secondary text-xs py-2 px-4 text-red-400 hover:text-red-300 flex-1"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="glass-card p-8 text-center space-y-3">
              <p className="text-fg-60 text-sm">
                No proposals found in the staging queue.
              </p>
              <button onClick={() => setActiveTab("create")} className="btn-secondary text-xs px-4 py-2">
                Create a Test Proposal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Community Observations Moderation */}
      {activeTab === "community" && (
        <div className="space-y-4">
          {observationsLoading ? (
            <div className="py-12 text-center text-fg-muted text-sm">Loading community submissions...</div>
          ) : observations && observations.length > 0 ? (
            observations.map((obs) => (
              <div key={obs.id} className="glass-card p-5 space-y-3 border-l-4 border-l-[var(--accent)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text)] text-base">{obs.cities?.name}</span>
                    <span className="badge-brand text-xs uppercase">{obs.category_code}</span>
                    {obs.housing_type && (
                      <span className="text-xs px-2 py-0.5 rounded bg-panel-2 text-fg-70">
                        {obs.housing_type}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-fg-soft">
                    {new Date(obs.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-4 py-2 border-y border-line">
                  <div>
                    <span className="text-xs text-fg-muted block">Submitted Amount</span>
                    <span className="font-mono text-xl font-bold text-[var(--accent)]">
                      {formatCurrency(BigInt(obs.amount_minor_units), obs.currency_code, locale === "id" ? "id-ID" : "en-US")}
                    </span>
                  </div>

                  {obs.note && (
                    <div className="flex-1 pl-4 border-l border-line text-xs text-fg-70">
                      <span className="text-fg-soft block font-semibold">Sanitized Note:</span>
                      <p className="italic">{obs.note}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={async () => {
                      const client = supabase as any;
                      await client.from("community_observations").update({ status: "approved" }).eq("id", obs.id);
                      refetchObservations();
                    }}
                    className="btn-primary text-xs py-2 px-4 flex-1"
                  >
                    ✓ Approve Community Price
                  </button>

                  <button
                    onClick={async () => {
                      const client = supabase as any;
                      await client.from("community_observations").update({ status: "rejected" }).eq("id", obs.id);
                      refetchObservations();
                    }}
                    className="btn-secondary text-xs py-2 px-4 text-red-400 flex-1"
                  >
                    ✕ Reject Observation
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-8 text-center space-y-3">
              <p className="text-fg-60 text-sm">No pending community observations requiring moderation.</p>
              <a href="/contribute" className="btn-secondary text-xs px-4 py-2 inline-block">
                Submit an Observation at /contribute →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Manual Proposal Creator */}
      {activeTab === "create" && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">Manual Test Proposal Creator</h2>
            <p className="text-xs text-fg-muted mt-0.5">
              Simulate a proposal submission from Hermes or Apify directly into the staging table.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              ✅ {submitSuccess}
            </div>
          )}

          <form onSubmit={handleCreateProposal} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-fg-60">Target City</label>
                <select
                  required
                  className="form-select text-sm"
                  value={formCityId}
                  onChange={(e) => {
                    setFormCityId(e.target.value);
                    const c = cities?.find((x) => x.id === e.target.value);
                    if (c && countries) {
                      const co = countries.find((x) => x.id === c.country_id);
                      const curr = co?.code === "DE" ? "EUR" : co?.code === "JP" ? "JPY" : "IDR";
                      setFormCurrency(curr as any);
                    }
                  }}
                >
                  <option value="" disabled>Select City</option>
                  {cities?.map((c) => {
                    const co = countries?.find((x) => x.id === c.country_id);
                    const flag = co?.code === "DE" ? "🇩🇪" : co?.code === "JP" ? "🇯🇵" : "🇮🇩";
                    return (
                      <option key={c.id} value={c.id}>{c.name} ({flag})</option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-fg-60">Category Code</label>
                <select
                  className="form-select text-sm"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="housing">housing (Housing)</option>
                  <option value="food">food (Food & Groceries)</option>
                  <option value="transport">transport (Public Transport)</option>
                  <option value="utilities">utilities (Utilities & SIM)</option>
                  <option value="lifestyle">lifestyle (Lifestyle & Leisure)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-fg-60">Currency</label>
                <select
                  className="form-select text-sm"
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value as any)}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="IDR">IDR (Rp)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-fg-60">Proposed Amount (Major Units)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="form-select text-sm"
                  value={formProposedMajor}
                  onChange={(e) => setFormProposedMajor(e.target.value)}
                  placeholder={formCurrency === "EUR" ? "520.00" : "55000"}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-fg-60">Confidence Score (0-1)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  className="form-select text-sm"
                  value={formConfidence}
                  onChange={(e) => setFormConfidence(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-fg-60">Rationale</label>
              <textarea
                required
                rows={2}
                className="form-select text-sm"
                value={formRationale}
                onChange={(e) => setFormRationale(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary py-3 w-full font-semibold text-sm">
              Submit Proposal to Staging Queue →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
