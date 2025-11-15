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
      text: "Hi! You can ask me about your cafeteria sales, top items, trends, and more. I will send your question to a Python service.",
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

  // Visualizations returned from Python
  const [visualizations, setVisualizations] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg = { id: Date.now(), role: "user", text: trimmed };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Get CSRF token from meta tag
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
          note: "From Python service",
        }));
        setKpis(mappedKpis);
      }

      if (Array.isArray(data.visualizations)) {
        setVisualizations(data.visualizations);
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

  // ========= Build data for the line chart from Python's visualizations ========
  const lineVis = visualizations.find((v) => v.type === "line");
  const lineData =
    lineVis && Array.isArray(lineVis.x) && Array.isArray(lineVis.y)
      ? lineVis.x.map((label, idx) => ({
          label,
          value: Number(lineVis.y[idx] ?? 0),
        }))
      : [];

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold text-gray-100">
          Data Analytics &amp; AI Assistant
        </h2>
      }
    >
      <Head title="Analytics" />

      {/* TOP BLUE HEADER */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-sky-700 to-indigo-700 px-6 py-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="max-w-xl">
          <h3 className="text-2xl font-semibold mb-2">
            Ask the AI to create analytics
          </h3>
          <p className="text-sm text-sky-100">
            On the left side, you can chat with the AI. Your questions will be
            sent to a Python service that will analyze your data and return KPIs
            and charts.
          </p>
        </div>

        <div className="max-w-xl text-right md:text-left">
          <h3 className="text-2xl font-semibold mb-2">
            Visualize your data for decisions
          </h3>
          <p className="text-sm text-sky-100">
            On the right side, all requested analytics will be visualized as KPI
            cards and charts to help you make better decisions in seconds.
          </p>
        </div>
      </div>

      {/* MAIN GRID: LEFT = CHAT, RIGHT = ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* LEFT: CHAT PANEL */}
        <section className="xl:col-span-1">
          <div className="rounded-2xl bg-slate-800 border border-slate-700 flex flex-col h-[32rem]">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-50">
                What can I help with?
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Ask in natural language. For example:{" "}
                <span className="italic text-slate-300">
                  &quot;Show me total sales for the last 7 days&quot; or
                  &quot;Which menu items are performing the worst this month?&quot;
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
                className="rounded-2xl bg-slate-800 border border-slate-700 p-4"
              >
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {kpi.label}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-50">
                  {money(kpi.value)} {kpi.unit}
                </div>
                {kpi.note && (
                  <div className="mt-1 text-xs text-slate-400">{kpi.note}</div>
                )}
              </div>
            ))}
          </div>

          {/* MAIN CHART AREA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Line chart for sales over time */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-100">
                  Sales Over Time (Last 7 Days)
                </h4>
                <span className="text-xs text-slate-500">
                  From Python service
                </span>
              </div>

              <div className="flex-1 min-h-[220px] rounded-xl border border-slate-700 bg-slate-900/40 p-2">
                {lineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
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

            {/* Second panel (still placeholder for future charts) */}
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-100">
                  Top &amp; Low Performing Items
                </h4>
                <span className="text-xs text-slate-500">
                  Coming in the next step
                </span>
              </div>
              <div className="flex-1 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500 text-center p-2">
                Soon we will add real charts here for best and worst menu items
                based on your database.
              </div>
            </div>
          </div>

          {/* EXTRA ROW FOR FUTURE VISUALS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-2">
                Low Performing Vendors (Demo)
              </h4>
              <div className="h-32 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500">
                Future small chart or table
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-2">
                Top Brands by Sales (Demo)
              </h4>
              <div className="h-32 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500">
                Future bar chart
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800 border border-slate-700 p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-2">
                Custom Insight Area
              </h4>
              <div className="h-32 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 flex items-center justify-center text-xs text-slate-500">
                We can use this for alerts, anomalies, or notes from the AI.
              </div>
            </div>
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
