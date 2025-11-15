import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from "recharts";

/**
 * Simple helper to show money-like numbers.
 */
const money = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AnalyticsIndex() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Hi! You can ask me about your cafeteria sales, top items, trends, forecasts and more. I will send your question to a Python service.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [kpis, setKpis] = useState([
    {
      label: "Total Sales (Real)",
      value: 0,
      unit: "USD",
      note: "Ask a question to load data from Python",
    },
  ]);

  const [visualizations, setVisualizations] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg = { id: Date.now(), role: "user", text: trimmed };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const tokenTag =
        typeof document !== "undefined"
          ? document.querySelector('meta[name="csrf-token"]')
          : null;
      const csrfToken = tokenTag ? tokenTag.getAttribute("content") : "";

      const response = await fetch("/analytics/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify({ message: trimmed }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = {
          id: Date.now() + 1,
          role: "assistant",
          text:
            "Sorry, something went wrong when contacting the analytics service.\n" +
            "Details: " +
            errorText,
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const data = await response.json();

      const aiMsg = {
        id: Date.now() + 2,
        role: "assistant",
        text:
          data.assistant_message ||
          "I received a response from Python, but there was no message.",
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (Array.isArray(data.kpis) && data.kpis.length > 0) {
        const mappedKpis = data.kpis.map((k, idx) => ({
          label: k.label || `KPI ${idx + 1}`,
          value: typeof k.value === "number" ? k.value : Number(k.value || 0),
          unit: k.unit || "",
          note: k.note || "From Python service",
        }));
        setKpis(mappedKpis);
      }

      if (Array.isArray(data.visualizations)) {
        setVisualizations(data.visualizations);
      } else {
        setVisualizations([]);
      }

      if (Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 3,
        role: "assistant",
        text:
          "Sorry, I could not reach the analytics service. Make sure the Python server is running.\n" +
          `Error: ${err}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Helper functions for charts ----------
  const getVis = (id, type) =>
    visualizations.find((v) => v.id === id && v.type === type);

  const toLineData = (vis) =>
    vis && Array.isArray(vis.x) && Array.isArray(vis.y)
      ? vis.x.map((label, idx) => ({
          label,
          value: Number(vis.y[idx] ?? 0),
        }))
      : [];

  const toBarData = (vis) =>
    vis && Array.isArray(vis.x) && Array.isArray(vis.y)
      ? vis.x.map((label, idx) => ({
          label,
          value: Number(vis.y[idx] ?? 0),
        }))
      : [];

  const vis7d = getVis("sales_7d", "line");
  const vis30d = getVis("sales_30d", "line");
  const visTopItems = getVis("top_items", "bar");
  const visWorstItems = getVis("worst_items", "bar");

  const lineData7d = toLineData(vis7d);
  const lineData30d = toLineData(vis30d);
  const barTopItems = toBarData(visTopItems);
  const barWorstItems = toBarData(visWorstItems);

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-gray-100">
            Data Analytics &amp; AI Assistant
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl">
            Chat with the assistant on the left. On the right you&apos;ll see
            live KPIs, trends, item performance, forecasts, and alerts generated
            from your cafeteria data.
          </p>
        </div>
      }
    >
      <Head title="Analytics" />

      {/* MAIN GRID: LEFT = CHAT, RIGHT = ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* LEFT: CHAT PANEL */}
        <section className="xl:col-span-1">
          <div className="rounded-2xl bg-slate-800 border border-slate-700 flex flex-col h-[32rem]">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-50">
                Ask about your data
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Examples:{" "}
                <span className="italic text-slate-300">
                  &quot;Show me total sales for the last 7 days&quot;,{" "}
                  &quot;Which items are the worst performers?&quot;,{" "}
                  &quot;Predict my sales for next week.&quot;
                </span>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line",
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-700 text-slate-100",
                    ].join(" ")}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-700 px-4 py-3 flex items-center gap-2"
            >
              <input
                type="text"
                className="flex-1 rounded-full bg-slate-900 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type your question about the data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading ? "Thinking..." : "Send"}
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT: ANALYTICS PANEL */}
        <section className="xl:col-span-2 space-y-4">
          {/* KPI CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 shadow-[0_0_30px_rgba(15,23,42,0.8)]"
              >
                {/* subtle top glow bar */}
                <div className="absolute inset-x-3 top-0 h-[2px] bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 opacity-60" />

                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                    {kpi.label}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {idx === 0 && "📊"}
                    {idx === 1 && "📆"}
                    {idx === 2 && "🔮"}
                  </div>
                </div>

                <div className="mt-3 text-2xl font-semibold text-slate-50">
                  {money(kpi.value)}{" "}
                  <span className="text-sm font-normal text-slate-300">
                    {kpi.unit}
                  </span>
                </div>

                {kpi.note && (
                  <div className="mt-2 text-[11px] leading-snug text-slate-400">
                    {kpi.note}
                  </div>
                )}
              </div>
            ))}
          </div>



          {/* FIRST CHART ROW: 7-day + 30-day */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 7-day line chart */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-100">
                  {vis7d?.title || "Sales Over Time"}
                </h4>

                <span className="text-xs text-slate-500">
                  From Python service
                </span>
              </div>

              <div className="flex-1 min-h-[220px] rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {lineData7d.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData7d}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value) => [`${money(value)} USD`, "Sales"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Ask something like{" "}
                    <span className="italic">
                      &quot;Show me total sales for the last 7 days&quot;
                    </span>{" "}
                    and I will draw a line chart here.
                  </div>
                )}
              </div>
            </div>

            {/* 30-day line chart */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-100">
                  {vis30d?.title || "Sales Summary"}
                </h4>

                <span className="text-xs text-slate-500">
                  From Python service
                </span>
              </div>

              <div className="flex-1 min-h-[220px] rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {lineData30d.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData30d}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value) => [`${money(value)} USD`, "Sales"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    When enough data is available for the last 30 days, a
                    monthly trend will appear here.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECOND CHART ROW: Top & worst items + Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top items */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-slate-100">
                  {visTopItems?.title || "Top Performing Items"}
                </h4>

                <span className="text-[10px] text-slate-500">Units sold</span>
              </div>
              <div className="flex-1 min-h-[160px] rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {barTopItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barTopItems}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value) => [`${value} units`, "Units sold"]}
                        labelFormatter={(label) => label}
                      />
                      <Bar dataKey="value" fill="#22c55e">
                        <LabelList
                          dataKey="value"
                          position="top"
                          formatter={(v) => v}
                          style={{ fontSize: 10, fill: "#e5e7eb" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Once items have sales in the last 30 days, your top 5 items
                    will be shown here with exact unit counts.
                  </div>
                )}
              </div>
            </div>

            {/* Worst items */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-slate-100">
                  {visWorstItems?.title || "Worst Performing Items"}
                </h4>

                <span className="text-[10px] text-slate-500">Units sold</span>
              </div>
              <div className="flex-1 min-h-[160px] rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {barWorstItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barWorstItems}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value) => [`${value} units`, "Units sold"]}
                        labelFormatter={(label) => label}
                      />
                      <Bar dataKey="value" fill="#f97316">
                        <LabelList
                          dataKey="value"
                          position="top"
                          formatter={(v) => v}
                          style={{ fontSize: 10, fill: "#e5e7eb" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Once there is enough item-level data, your 5 lowest selling
                    items will be highlighted here with their unit counts.
                  </div>
                )}
              </div>
            </div>

            {/* Alerts & Insights */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <h4 className="text-sm font-semibold text-slate-100 mb-2">
                Alerts &amp; Insights
              </h4>
              <div className="flex-1 min-h-[160px] rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-200 space-y-2 overflow-y-auto">
                {alerts && alerts.length > 0 ? (
                  alerts.map((a, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-slate-800/80 border border-slate-600 px-2 py-1"
                    >
                      {a}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Ask a sales question and I will show key alerts and insights
                    here based on your recent performance.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
