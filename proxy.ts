import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";

function matchesPath(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as UserRole | undefined;
  const schoolId = token.schoolId as string | null | undefined;
  const pathname = req.nextUrl.pathname;

  if (role === UserRole.SUPER_ADMIN && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/platform/dashboard", req.url));
  }

  if (matchesPath(pathname, "/dashboard")) {
    if (role === UserRole.TEACHER) {
      return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
    }
    if (role === UserRole.STUDENT) {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
  }

  if (matchesPath(pathname, "/platform")) {
    if (role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (matchesPath(pathname, "/teacher")) {
    if (role !== UserRole.TEACHER) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (!schoolId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (matchesPath(pathname, "/student")) {
    if (role !== UserRole.STUDENT) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (!schoolId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  const schoolAdminOnlyPaths = [
    "/dashboard",
    "/analytics",
    "/students",
    "/staff",
    "/subjects",
    "/courses",
    "/classes",
    "/sections",
    "/enrollments",
    "/attendance",
    "/staff-attendance",
    "/timetable",
    "/invoices",
    "/payments",
    "/payroll",
    "/exports",
    "/settings",
  ];

  const isSchoolAdminRoute = schoolAdminOnlyPaths.some((route) =>
    matchesPath(pathname, route),
  );

  if (isSchoolAdminRoute) {
    if (role !== UserRole.SCHOOL_ADMIN && role !== UserRole.SUPER_ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (!schoolId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
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
    "/analytics/:path*",
    "/students/:path*",
    "/subjects/:path*",
    "/courses/:path*",
    "/classes/:path*",
    "/sections/:path*",
    "/enrollments/:path*",
    "/attendance/:path*",
    "/staff-attendance/:path*",
    "/timetable/:path*",
    "/invoices/:path*",
    "/payments/:path*",
    "/payroll/:path*",
    "/exports/:path*",
    "/staff/:path*",
    "/settings/:path*",
  ],
};
