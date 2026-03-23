import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";

const permissionGuards: Record<string, string> = {
  "/students": "MANAGE_STUDENTS",
  "/teachers": "MANAGE_TEACHERS",
  "/classes": "MANAGE_CLASSES",
  "/attendance": "VIEW_REPORTS",
  "/payments": "VIEW_REPORTS",
  "/settings/permissions": "MANAGE_TEACHERS",
  "/platform/tenants": "MANAGE_TENANTS",
  "/platform/subscriptions": "MANAGE_SUBSCRIPTIONS",
};

function hasPermission(pathname: string, permissions: string[]) {
  const matched = Object.entries(permissionGuards).find(([route]) =>
    pathname.startsWith(route),
  );
  if (!matched) return true;

  const [, permission] = matched;
  return permissions.includes("*") || permissions.includes(permission);
}

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as UserRole | undefined;
  const tenantId = token.tenantId as string | null | undefined;
  const permissions = (token.permissions as string[] | undefined) ?? [];
  const pathname = req.nextUrl.pathname;

  if (role === UserRole.SUPER_ADMIN && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/platform/dashboard", req.url));
  }

  if (pathname.startsWith("/platform")) {
    if (role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/teachers") ||
    pathname.startsWith("/classes") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/settings")
  ) {
    if (!tenantId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (!hasPermission(pathname, permissions) && role !== UserRole.SUPER_ADMIN) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  if (tenantId) {
    requestHeaders.set("x-tenant-id", tenantId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/platform/:path*",
    "/dashboard/:path*",
    "/students/:path*",
    "/classes/:path*",
    "/attendance/:path*",
    "/payments/:path*",
    "/teachers/:path*",
    "/settings/:path*",
  ],
};
