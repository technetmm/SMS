import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";

const permissionGuards: Record<string, string> = {
  "/students": "student.view",
  "/staff": "staff.view",
  "/classes": "class.view",
  "/attendance": "attendance.view",
  "/payments": "fee.view",
  "/settings/roles": "role.view",
  "/settings/permissions": "permission.assign",
  "/platform/tenants": "settings.view",
  "/platform/subscriptions": "settings.view",
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
  const schoolId = token.schoolId as string | null | undefined;
  const permissions = (token.permissions as string[] | undefined) ?? [];
  const pathname = req.nextUrl.pathname;

  if (role === UserRole.SUPER_ADMIN && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/platform/dashboard", req.url));
  }

  if (pathname.startsWith("/dashboard")) {
    if (role === UserRole.TEACHER) {
      return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
    }
    if (role === UserRole.STUDENT) {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
  }

  if (pathname.startsWith("/platform")) {
    if (role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (pathname.startsWith("/teacher")) {
    if (role !== UserRole.TEACHER) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (pathname.startsWith("/student")) {
    if (role !== UserRole.STUDENT) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (
    pathname.startsWith("/settings") &&
    role !== UserRole.SCHOOL_ADMIN &&
    role !== UserRole.SUPER_ADMIN
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/students") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/classes") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/settings")
  ) {
    if (!schoolId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (!hasPermission(pathname, permissions) && role !== UserRole.SUPER_ADMIN) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  if (schoolId) {
    requestHeaders.set("x-school-id", schoolId);
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
    "/teacher/:path*",
    "/student/:path*",
    "/students/:path*",
    "/classes/:path*",
    "/attendance/:path*",
    "/payments/:path*",
    "/staff/:path*",
    "/settings/:path*",
  ],
};
