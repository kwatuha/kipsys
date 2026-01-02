"use client"

import { useTheme } from "next-themes"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Jan",
    Inpatients: 65,
    Outpatients: 120,
    Emergency: 28,
  },
  {
    name: "Feb",
    Inpatients: 59,
    Outpatients: 110,
    Emergency: 32,
  },
  {
    name: "Mar",
    Inpatients: 80,
    Outpatients: 145,
    Emergency: 35,
  },
  {
    name: "Apr",
    Inpatients: 81,
    Outpatients: 132,
    Emergency: 30,
  },
  {
    name: "May",
    Inpatients: 56,
    Outpatients: 125,
    Emergency: 27,
  },
  {
    name: "Jun",
    Inpatients: 55,
    Outpatients: 105,
    Emergency: 24,
  },
  {
    name: "Jul",
    Inpatients: 40,
    Outpatients: 98,
    Emergency: 20,
  },
]

export function DashboardChart() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
        <XAxis
          dataKey="name"
          stroke={isDark ? "#888" : "#333"}
          tick={{ fill: isDark ? "#888" : "#333", fontSize: 10 }}
          tickLine={{ stroke: isDark ? "#555" : "#ccc" }}
          axisLine={{ stroke: isDark ? "#555" : "#ccc" }}
        />
        <YAxis
          stroke={isDark ? "#888" : "#333"}
          tick={{ fill: isDark ? "#888" : "#333", fontSize: 10 }}
          tickLine={{ stroke: isDark ? "#555" : "#ccc" }}
          axisLine={{ stroke: isDark ? "#555" : "#ccc" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "#1f2937" : "#fff",
            color: isDark ? "#fff" : "#000",
            border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            fontSize: "11px",
            padding: "4px 8px",
          }}
          itemStyle={{ fontSize: "10px" }}
          labelStyle={{ fontSize: "10px", fontWeight: "bold" }}
        />
        <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} iconSize={8} iconType="circle" />
        <Bar dataKey="Inpatients" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={6} />
        <Bar dataKey="Outpatients" fill="#10b981" radius={[2, 2, 0, 0]} barSize={6} />
        <Bar dataKey="Emergency" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={6} />
      </BarChart>
    </ResponsiveContainer>
  )
}
