"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Globe, Calendar, SlidersHorizontal, X, ChevronDown, Search, Receipt, Bell, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import Breadcrumb from "@/components/Breadcrumb";

function isRawDescription(desc) {
  if (!desc || desc.length < 40) return true;
  if (/\|/.test(desc)) return true;
  if (/\b(menu|home page|sign in|login|copyright|all rights reserved|admissions open|click here|read more)\b/i.test(desc)) return true;
  return false;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatEventType(type) {
  if (!type) return type;
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

function SelectFilter({ label, options, value, onChange, placeholder }) {
  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function UniversitiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Filter state — pre-populate from URL param if present
  const initialProgram = searchParams.get("program") ?? "";
  const [showFilters, setShowFilters] = useState(!!initialProgram);
  const [programFilter, setProgramFilter] = useState(initialProgram);
  const [cityFilter, setCityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCards, setExpandedCards] = useState(() => new Set());
  const [favorites, setFavorites] = useState(() => new Set());
  const [justAdded, setJustAdded] = useState(() => new Set());

  // Load favorites from DB if user is logged in
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return;
    fetch("/api/universities/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.favorites) setFavorites(new Set(data.favorites)); })
      .catch(() => {});
  }, []);

  const toggleFavorite = async (id, name) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      toast.error("Please log in to save favourites", {
        action: { label: "Login", onClick: () => router.push("/auth") },
      });
      return;
    }

    try {
      const res = await fetch(`/api/universities/${id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        toast.error("Session expired. Please log in again.", {
          action: { label: "Login", onClick: () => router.push("/auth") },
        });
        return;
      }

      if (!res.ok) throw new Error();
      const data = await res.json();

      setFavorites((prev) => {
        const next = new Set(prev);
        if (data.favorited) {
          next.add(id);
          setJustAdded((ja) => new Set(ja).add(id));
          setTimeout(() => setJustAdded((ja) => { const n = new Set(ja); n.delete(id); return n; }), 1400);
          toast.success(`You'll receive event reminders for ${name}`, { duration: 4000 });
        } else {
          next.delete(id);
          toast.info(`Removed ${name} from favourites`);
        }
        return next;
      });
    } catch {
      toast.error("Failed to update favourites. Please try again.");
    }
  };

  const toggleExpanded = (id) =>
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    console.log("[Universities] Fetching /api/universities …");
    fetch("/api/universities")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load universities");
        return res.json();
      })
      .then((data) => {
        const list = data.universities || [];
        const totalPrograms = list.reduce((sum, u) => sum + (u.programs?.length || 0), 0);
        console.log(
          `[Universities] Loaded ${list.length} universities, ${totalPrograms} programs total`
        );
        list.forEach((u) =>
          console.log(
            `  • ${u.name}: ${u.programs?.length || 0} program(s), ${u.events?.length || 0} event(s)`
          )
        );
        setUniversities(list);
      })
      .catch((err) => {
        console.error("[Universities] Load failed:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Derive unique filter options from data
  const allPrograms = useMemo(() => {
    const set = new Set();
    universities.forEach((u) => u.programs?.forEach((p) => set.add(p.name)));
    return [...set].sort();
  }, [universities]);

  const allCities = useMemo(() => {
    const set = new Set();
    universities.forEach((u) => {
      const city = u.location?.trim();
      if (city) set.add(city);
    });
    return [...set].sort();
  }, [universities]);

  // Apply filters
  const filtered = useMemo(() => {
    return universities.filter((u) => {
      // Text search
      if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // City filter
      if (cityFilter && u.location?.trim() !== cityFilter) return false;

      // Program filter — normalize spaces/hyphens so "Cybersecurity" matches "Cyber Security"
      if (programFilter) {
        const normalize = (s) => s.toLowerCase().replace(/[\s-]+/g, "");
        const filterNorm = normalize(programFilter);
        const match = u.programs?.some((p) => {
          const name = p.name.toLowerCase();
          return name.includes(programFilter.toLowerCase()) || normalize(p.name).includes(filterNorm);
        });
        if (!match) return false;
      }

      return true;
    });
  }, [universities, searchQuery, cityFilter, programFilter]);

  // Active filter chips
  const activeFilters = [
    cityFilter && { key: "city", label: `City: ${cityFilter}`, clear: () => setCityFilter("") },
    programFilter && { key: "program", label: `Program: ${programFilter}`, clear: () => setProgramFilter("") },
  ].filter(Boolean);

  const clearAll = () => {
    setCityFilter("");
    setProgramFilter("");
    setSearchQuery("");
  };

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Navbar />

      <main className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <Breadcrumb />

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Universities in Pakistan
            </h1>
            <p className="text-gray-500 text-base">
              Browse {universities.length} institutions — filter by city or program.
            </p>
          </div>

          {/* Search + Filter toggle row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search university name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                showFilters || activeFilters.length > 0
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SelectFilter
                  label="City"
                  options={allCities}
                  value={cityFilter}
                  onChange={setCityFilter}
                  placeholder="All cities"
                />
                <SelectFilter
                  label="Program"
                  options={allPrograms}
                  value={programFilter}
                  onChange={setProgramFilter}
                  placeholder="All programs"
                />
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-sm text-gray-500">Active:</span>
              {activeFilters.map((f) => (
                <FilterChip key={f.key} label={f.label} onRemove={f.clear} />
              ))}
              <button
                onClick={clearAll}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Result count */}
          {!loading && !error && (
            <p className="text-sm text-gray-400 mb-6">
              Showing <span className="font-semibold text-gray-700">{filtered.length}</span>
              {" "}of {universities.length} universities
            </p>
          )}

          {/* States */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading universities…</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-red-500">{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-24">
              <p className="text-gray-400 text-lg mb-2">No universities match your filters.</p>
              <button onClick={clearAll} className="text-primary font-medium hover:underline text-sm">
                Clear filters
              </button>
            </div>
          )}

          {/* Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((uni) => {
              const nextEvent =
                uni.events?.find((e) => e.status?.toLowerCase() === "open") || uni.events?.[0];

              // For fee display: show range across programs
              const fees = uni.programs
                ?.map((p) => Number(p.fee))
                .filter((f) => !isNaN(f) && f > 0);
              const feeRange =
                fees?.length > 0
                  ? fees.length === 1
                    ? `PKR ${fees[0].toLocaleString()}`
                    : `PKR ${Math.min(...fees).toLocaleString()} – ${Math.max(...fees).toLocaleString()}`
                  : null;

              // Highlighted programs if program filter active; otherwise respect
              // the per-card expand toggle (collapsed shows the first 5).
              const isExpanded = expandedCards.has(uni.id);
              const totalPrograms = uni.programs?.length || 0;
              const displayPrograms = programFilter
                ? uni.programs?.filter((p) =>
                    p.name.toLowerCase().includes(programFilter.toLowerCase())
                  )
                : isExpanded
                ? uni.programs
                : uni.programs?.slice(0, 5);

              return (
                <div
                  key={uni.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all"
                >
                  {/* Card header */}
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{uni.name}</h3>
                      {uni.location && (
                        <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {uni.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {nextEvent && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            nextEvent.status?.toLowerCase() === "open"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-primary"
                          }`}
                        >
                          {nextEvent.status || formatEventType(nextEvent.event_type)}
                        </span>
                      )}
                      <button
                        onClick={() => toggleFavorite(uni.id, uni.name)}
                        title={favorites.has(uni.id) ? "Remove from favourites" : "Add to favourites"}
                        className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                          favorites.has(uni.id)
                            ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                            : "bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-primary border border-gray-100"
                        }`}
                      >
                        <Bell className={`w-4 h-4 transition-transform duration-150 ${justAdded.has(uni.id) ? "scale-125" : "scale-100"}`} />
                        {justAdded.has(uni.id) && (
                          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-green-500 rounded-full animate-bounce shadow-sm">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {uni.description && !isRawDescription(uni.description) && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {uni.description}
                    </p>
                  )}

                  {/* Programs */}
                  {displayPrograms?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Programs{totalPrograms > 0 ? ` (${totalPrograms})` : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {displayPrograms.map((prog) => (
                          <span
                            key={prog.id}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              programFilter &&
                              prog.name.toLowerCase().includes(programFilter.toLowerCase())
                                ? "bg-primary text-white"
                                : "bg-blue-50 text-primary"
                            }`}
                          >
                            {prog.name}
                          </span>
                        ))}
                        {!programFilter && totalPrograms > 5 && (
                          <button
                            onClick={() => toggleExpanded(uni.id)}
                            className="px-2.5 py-1 rounded-full text-xs font-medium text-primary bg-gray-100 hover:bg-gray-200 transition"
                          >
                            {isExpanded ? "Show less" : `+${totalPrograms - 5} more`}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fee + event row */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    {feeRange && (
                      <span className="font-medium text-gray-700">{feeRange}</span>
                    )}
                    {nextEvent?.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {formatEventType(nextEvent.event_type)}: {formatDate(nextEvent.start_date)}
                        {nextEvent.end_date ? ` – ${formatDate(nextEvent.end_date)}` : ""}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={`/universities/${uni.id}`}
                      className="flex-1 text-center bg-blue-50 text-primary border border-blue-200 px-4 py-2 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all font-medium text-sm"
                    >
                      View Programs
                    </a>
                    {uni.fee_structure_url && (
                      <a
                        href={uni.fee_structure_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl hover:bg-blue-700 transition font-medium text-sm"
                        title="View fee structure"
                      >
                        <Receipt className="w-4 h-4" />
                        Fees
                      </a>
                    )}
                    {uni.website && (
                      <a
                        href={uni.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
