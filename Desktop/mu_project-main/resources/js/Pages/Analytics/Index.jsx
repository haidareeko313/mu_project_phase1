import React, { useState } from "react";
import { Head, useRemember } from "@inertiajs/react";
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
  // ----------------- PERSISTED STATE (survives navigation) -----------------
  const [messages, setMessages] = useRemember(
    [
      {
        id: 1,
        role: "assistant",
        text: "Hi! You can ask me about your cafeteria sales, top items, trends, payments, inventory, forecasts and more. I’ll send your questions to a Python analytics service.",
      },
    ],
    "analytics.messages"
  );

  const [kpis, setKpis] = useRemember([], "analytics.kpis");
  const [visualizations, setVisualizations] = useRemember(
    [],
    "analytics.visualizations"
  );
  const [alerts, setAlerts] = useRemember([], "analytics.alerts");
  const [lastQuestion, setLastQuestion] = useRemember(
    "",
    "analytics.lastQuestion"
  );
  const [windowDays, setWindowDays] = useRemember(7, "analytics.windowDays");

  // ----------------- LOCAL / EPHEMERAL STATE -----------------
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Suggested prompts for quick clicks
  const quickPrompts = [
    "Show me sales for the last 7 days",
    "Best and worst items in the last 30 days",
    "How many orders were CASH vs QR in the last 14 days?",
    "What items increased in inventory today?",
  ];

  // ----------------- CHAT + REQUEST HANDLERS -----------------
  const sendRequest = async (
    message,
    addUserBubble = true,
    overrideWindowDays = null
  ) => {
    const trimmed = (message || "").trim();
    if (!trimmed || isLoading) return;

    const windowToSend =
      typeof overrideWindowDays === "number" ? overrideWindowDays : windowDays;

    if (addUserBubble) {
      const userMsg = { id: Date.now(), role: "user", text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
    }

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
        body: JSON.stringify({
          message: trimmed,
          window_days: windowToSend,
        }),
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
      } else {
        setKpis([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setLastQuestion(trimmed);
    setInput("");
    await sendRequest(trimmed, true, null);
  };

  const handleQuickAsk = (prompt) => {
    if (isLoading) return;
    setLastQuestion(prompt);
    setInput("");
    sendRequest(prompt, true, null);
  };

  const handleWindowChange = (days) => {
    if (windowDays === days) return;
    setWindowDays(days);

    // If there was a previous question, quietly refresh the analytics for new window
    if (lastQuestion && !isLoading) {
      sendRequest(lastQuestion, false, days);
    }
  };

  // ----------------- HELPER FOR VISUALIZATIONS -----------------
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
  const visForecast = getVis("forecast_7d", "line");
  const visTopItems = getVis("top_items", "bar");
  const visWorstItems = getVis("worst_items", "bar");
  const visHeatmap = visualizations.find(
    (v) => v.id === "traffic_heatmap" && v.type === "heatmap"
  );

  const lineData7d = toLineData(vis7d);
  const lineForecast = toLineData(visForecast);
  const barTopItems = toBarData(visTopItems);
  const barWorstItems = toBarData(visWorstItems);

  const heatmapDays =
    visHeatmap && Array.isArray(visHeatmap.days) ? visHeatmap.days : [];
  const heatmapHours =
    visHeatmap && Array.isArray(visHeatmap.hours) ? visHeatmap.hours : [];
  const heatmapMatrix =
    visHeatmap && Array.isArray(visHeatmap.matrix)
      ? visHeatmap.matrix
      : [];

  let heatmapMax = 0;
  if (heatmapMatrix.length > 0) {
    for (const row of heatmapMatrix) {
      for (const v of row) {
        if (v > heatmapMax) heatmapMax = v;
      }
    }
  }

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-gray-100">
              Data Analytics &amp; AI Assistant
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Chat with the assistant on the left. On the right you&apos;ll see
              live KPIs, trends, item performance, payments, heatmaps, forecasts,
              and alerts generated from your cafeteria data.
            </p>
          </div>
        </div>
      }
    >
      <Head title="Analytics" />

      {/* MAIN GRID: LEFT = CHAT, RIGHT = ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] gap-6 items-start">
        {/* LEFT: CHAT PANEL */}
        <section className="xl:col-span-1">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-700/80 flex flex-col h-[34rem] max-h-[34rem] shadow-[0_0_35px_rgba(15,23,42,0.9)] backdrop-blur">
            <div className="px-5 py-4 border-b border-slate-700/80">
              <h3 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-400 text-xs font-bold text-slate-950 shadow-md shadow-indigo-900/60">
                  AI
                </span>
                Ask about your data
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Examples:{" "}
                <span className="italic text-slate-300">
                  &quot;Show me total sales for the last 7 days&quot;,{" "}
                  &quot;Best and worst items in the last 30 days&quot;,{" "}
                  &quot;How many orders were CASH vs QR in the last 14 days&quot;,{" "}
                  &quot;What items increased in inventory today?&quot;
                </span>
              </p>

              {/* Quick prompts */}
              <div className="mt-3 flex flex-wrap gap-2">
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickAsk(q)}
                    className="rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1 text-[11px] text-slate-200 hover:border-indigo-400 hover:bg-slate-900/90 transition"
                    disabled={isLoading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* MESSAGES AREA – fixed height with scroll */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex max-w-[85%] items-start gap-2">
                      {!isUser && (
                        <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-400 text-[10px] font-semibold text-slate-950 flex items-center justify-center shadow-md shadow-indigo-900/60">
                          AI
                        </div>
                      )}
                      <div
                        className={[
                          "rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line shadow-md",
                          isUser
                            ? "bg-indigo-600 text-white shadow-indigo-900/60"
                            : "bg-slate-800 text-slate-100 shadow-slate-900/60",
                        ].join(" ")}
                      >
                        {m.text}
                      </div>
                      {isUser && (
                        <div className="mt-1 h-6 w-6 shrink-0 rounded-full bg-slate-700 text-[10px] font-semibold text-slate-100 flex items-center justify-center shadow-md shadow-slate-900/60">
                          U
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[70%] items-center gap-2 rounded-2xl bg-slate-800 px-3 py-2 text-[11px] text-slate-200 shadow-md shadow-slate-900/60">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-400 text-[9px] font-semibold text-slate-950">
                      •
                    </span>
                    <span>
                      Thinking about your data
                      <span className="animate-pulse">…</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* INPUT */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-700/80 px-4 py-3 flex items-center gap-2 bg-slate-900/80"
            >
              <input
                type="text"
                className="flex-1 rounded-full bg-slate-950 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400"
                placeholder="Type your question about the data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-900/70"
                disabled={isLoading}
              >
                {isLoading ? "Thinking..." : "Send"}
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT: ANALYTICS PANEL */}
        <section className="xl:col-span-1 space-y-4">
          {/* KPI CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-700/80 p-4 shadow-[0_0_30px_rgba(15,23,42,0.8)]"
              >
                <div className="absolute inset-x-3 top-0 h-[2px] bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 opacity-60" />
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
                    {kpi.label}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {idx === 0 && "📊"}
                    {idx === 1 && "📅"}
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

          {/* FIRST CHART ROW: actual sales + forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Actual sales */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-100">
                  {vis7d?.title || "Sales - Last Period"}
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
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Ask something like{" "}
                    <span className="italic">
                      &quot;Show me sales for the last 7 days&quot;
                    </span>{" "}
                    and I will draw a line chart here.
                  </div>
                )}
              </div>
            </div>

            {/* Forecast chart */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-100">
                  {visForecast?.title || "Forecast - Next 7 Days"}
                </h4>
                <span className="text-xs text-slate-500">
                  From Python service
                </span>
              </div>
              <div className="flex-1 min-h-[220px] rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {lineForecast.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineForecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value) => [`${money(value)} USD`, "Forecast"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Once enough history is available, a 7-day forecast curve
                    will appear here.
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
              <div className="flex-1 min-h-[180px] rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {barTopItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barTopItems}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9 }}
                        interval={0}
                        angle={-25}
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
                    Once items have sales in the selected period, your top
                    items will be shown here with exact unit counts.
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
              <div className="flex-1 min-h-[180px] rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {barWorstItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barWorstItems}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9 }}
                        interval={0}
                        angle={-25}
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
                    Once there is enough item-level data, your lowest selling
                    items will be highlighted here with their unit counts.
                  </div>
                )}
              </div>
            </div>

            {/* Alerts & Insights */}
            <div className="rounded-2xl bg-slate-900 border border-slate-700/80 p-4 flex flex-col shadow-[0_0_35px_rgba(15,23,42,0.9)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-50">
                    Alerts &amp; Insights
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Only key alerts and a few smart suggestions based on your
                    latest data.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live</span>
                </div>
              </div>

              <div className="flex-1 min-h-[180px] rounded-xl bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/95 border border-slate-700/80 p-3 text-xs text-slate-200 space-y-2 overflow-y-auto">
                {alerts && alerts.length > 0 ? (
                  alerts.slice(0, 5).map((a, idx) => (
                    <div
                      key={idx}
                      className="relative flex gap-2 rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2 shadow-[0_0_20px_rgba(15,23,42,0.7)]"
                    >
                      <div className="w-1 rounded-full bg-gradient-to-b from-indigo-400 via-sky-400 to-emerald-400" />
                      <div className="flex-1">{a}</div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Ask a sales, payments, or inventory question and I will
                    surface only the most important alerts and actions here.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HEATMAP ROW */}
          <div className="grid grid-cols-1">
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-100">
                  {visHeatmap?.title || `Traffic Heatmap (Day x Hour)`}
                </h4>
                <span className="text-xs text-slate-500">
                  Each cell shows number of orders.
                </span>
              </div>

              <div className="flex-1 min-h-[220px] rounded-xl border border-slate-700 bg-slate-900/40 p-3 overflow-x-auto">
                {heatmapDays.length > 0 && heatmapHours.length > 0 ? (
                  <div className="inline-block">
                    {/* Hour labels */}
                    <div className="grid grid-cols-[80px_repeat(24,1fr)] mb-1 text-[9px] text-slate-400">
                      <div />
                      {heatmapHours.map((h) => (
                        <div key={h} className="text-center">
                          {h % 3 === 0 ? `${h}:00` : ""}
                        </div>
                      ))}
                    </div>
                    {/* Rows */}
                    <div className="space-y-[2px]">
                      {heatmapDays.map((dayLabel, rowIdx) => (
                        <div
                          key={dayLabel}
                          className="grid grid-cols-[80px_repeat(24,1fr)] items-center gap-[2px]"
                        >
                          <div className="text-[10px] text-slate-300 pr-2 text-right">
                            {dayLabel}
                          </div>
                          {heatmapHours.map((h, colIdx) => {
                            const value =
                              (heatmapMatrix[rowIdx] &&
                                heatmapMatrix[rowIdx][colIdx]) ||
                              0;
                            const intensity =
                              heatmapMax > 0
                                ? 0.1 + 0.9 * (value / heatmapMax)
                                : 0;
                            const bg =
                              value === 0
                                ? "rgba(15,23,42,0.9)"
                                : `rgba(56,189,248,${intensity.toFixed(2)})`;
                            return (
                              <div
                                key={colIdx}
                                className="h-5 rounded-[4px] border border-slate-800 flex items-center justify-center"
                                style={{ backgroundColor: bg }}
                                title={`${dayLabel} @ ${h}:00 → ${value} orders`}
                              >
                                {value > 0 && value === heatmapMax && (
                                  <span className="text-[8px] text-slate-900 font-semibold">
                                    {value}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 text-center px-4">
                    Once you have enough orders in the selected period, a
                    heatmap of busiest hours by weekday will appear here.
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
