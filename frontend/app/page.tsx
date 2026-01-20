"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Filter,
  Table as TableIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Search,
  Database,
  MapPin,
  RefreshCw
} from "lucide-react";

const API_KEY = "579b464db66ec23bdd00000148c8a89dd06f4f7050828ca356664856";
const API_BASE_URL = "http://localhost:8000";

interface DataRecord {
  date: string;
  state: string;
  district: string;
  pincode: number | string;
  age_0_5: number;
  age_5_17: number;
  age_18_greater: number;
  demo_age_5_17: number;
  demo_age_17_: number;
  bio_age_5_17: number;
  bio_age_17_: number;
}

export default function Home() {
  const [data, setData] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [states, setStates] = useState<Record<string, string[]>>({});
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Pagination
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // Load filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/metadata/filters`);
        setStates(response.data);
      } catch (err) {
        console.error("Failed to fetch filters", err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch data
  const fetchData = async (currentOffset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        "api-key": API_KEY,
        offset: currentOffset,
        limit: limit,
      };
      if (selectedState) params["filters[state]"] = selectedState;
      if (selectedDistrict) params["filters[district]"] = selectedDistrict;

      const response = await axios.get(`${API_BASE_URL}/resource/ecd49b12-3084-4521-8f7e-ca8bf72069ba`, { params });
      setData(response.data.data);
      setTotal(response.data.total);
      setOffset(currentOffset);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0);
  }, []);

  const handleFilter = () => {
    fetchData(0);
  };

  const handlePrevPage = () => {
    if (offset >= limit) fetchData(offset - limit);
  };

  const handleNextPage = () => {
    if (offset + limit < total) fetchData(offset + limit);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Database className="text-blue-600" />
              Enrollment Analytics
            </h1>
            <p className="text-slate-500 mt-1">Monitor enrollment, demographic, and biometric trends.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-sm font-medium text-slate-600">{loading ? 'Updating...' : 'System Active'}</span>
          </div>
        </header>

        {/* Filter Section */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
            <Filter size={18} />
            <h2>Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("");
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              >
                <option value="">All States</option>
                {Object.keys(states).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-400">District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedState}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium disabled:opacity-50"
              >
                <option value="">All Districts</option>
                {selectedState && states[selectedState]?.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Search size={18} />
                {loading ? "Searching..." : "Apply Filters"}
              </button>
            </div>
          </div>
        </section>

        {/* Charts & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Trend Chart */}
          <section className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <BarChart3 size={18} />
                <h2>Age Group Trends</h2>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-slate-500 font-medium">Age 0-5</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-slate-500 font-medium">Age 5-17</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="age_0_5"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="age_5_17"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 italic">
                  No data available for the current selection
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Data Table */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <TableIcon size={18} />
              <h2>Detailed Report</h2>
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-4">
              <span>Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} results</span>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                  className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={offset + limit >= total}
                  className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Date / Location</th>
                  <th className="px-6 py-4 text-center">Enroll (0-5)</th>
                  <th className="px-6 py-4 text-center">Enroll (5-17)</th>
                  <th className="px-6 py-4 text-center">Demo (5-17)</th>
                  <th className="px-6 py-4 text-center">Bio (5-17)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-red-500 font-medium">
                      {error}
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{row.state} › {row.district}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin size={10} /> {row.pincode} • {row.date}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-blue-600 bg-blue-50/10">{row.age_0_5}</td>
                      <td className="px-6 py-4 text-center font-medium text-emerald-600 bg-emerald-50/10">{row.age_5_17}</td>
                      <td className="px-6 py-4 text-center font-medium text-amber-600 bg-amber-50/10">{row.demo_age_5_17}</td>
                      <td className="px-6 py-4 text-center font-medium text-purple-600 bg-purple-50/10">{row.bio_age_5_17}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                      No records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-slate-400 text-sm py-4">
          Data provided via secure API • PIN: 400001
        </footer>
      </div>
    </main>
  );
}
