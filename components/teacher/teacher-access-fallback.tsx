import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TeacherAccessFallback() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Access</CardTitle>
      </CardHeader>
      <CardContent>
        Your staff profile is not linked yet. Please contact your school admin.
      </CardContent>
    </Card>
  );
}
