"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center px-6 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Something went wrong
          </CardTitle>
          <CardDescription>
            We hit an unexpected issue. You can retry now or go back safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.digest ? (
            <p className="text-xs text-muted-foreground">Error reference: {error.digest}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => unstable_retry()}>
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

