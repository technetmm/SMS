"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type AttendanceTrendPoint = {
  day: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
};

export function StudentAttendanceTrendChart({
  data,
  title = "Attendance Trend (30 days)",
}: {
  data: AttendanceTrendPoint[];
  title?: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: 0 }}>
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="present" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="absent" stroke="hsl(var(--destructive))" strokeWidth={2} />
            <Line type="monotone" dataKey="late" stroke="hsl(43 96% 56%)" strokeWidth={2} />
            <Line type="monotone" dataKey="leave" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
