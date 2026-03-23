"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SuperAdminCharts({
  revenueData,
  growthData,
}: {
  revenueData: Array<{ month: string; revenue: number }>;
  growthData: Array<{ month: string; schools: number }>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-72 rounded-xl border bg-background p-4">
        <p className="mb-2 text-sm font-medium">Revenue (Monthly)</p>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="currentColor" className="text-primary" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-72 rounded-xl border bg-background p-4">
        <p className="mb-2 text-sm font-medium">Subscription Growth</p>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="schools" stroke="currentColor" className="text-primary" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
