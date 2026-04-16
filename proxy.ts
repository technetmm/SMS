import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/app/generated/prisma/enums";
import type { AppLocale } from "@/i18n/config";
import { getLocaleFromPathname, withLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

function matchesPath(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

const handleI18nRouting = createMiddleware(routing);

function redirectWithLocale(
  req: NextRequest,
  locale: AppLocale,
  pathname: string,
) {
  return NextResponse.redirect(new URL(withLocale(pathname, locale), req.url));
}

export default async function proxy(req: NextRequest) {
  const { locale, pathnameWithoutLocale } = getLocaleFromPathname(
    req.nextUrl.pathname,
  );
  const resolvedLocale = locale ?? routing.defaultLocale;

  if (!locale) {
    return handleI18nRouting(req);
  }

  const token = await getToken({ req });
  const tokenUserId = typeof token?.id === "string" ? token.id : null;
  const role = token?.role as UserRole | undefined;
  const schoolId = token?.schoolId as string | null | undefined;
  const pathname = pathnameWithoutLocale;

  const protectedPaths = [
    "/platform",
    "/school/dashboard",
    "/teacher",
    "/student",
    "/school/analytics",
    "/school/students",
    "/school/subjects",
    "/school/courses",
    "/school/classes",
    "/school/sections",
    "/school/enrollments",
    "/school/attendance",
    "/school/staff-attendance",
    "/school/timetable",
    "/school/invoices",
    "/school/payments",
    "/school/payroll",
    "/school/exports",
    "/school/staff",
    "/school/settings",
  ];

  if (
    protectedPaths.some((route) => matchesPath(pathname, route)) &&
    (!token || !tokenUserId)
  ) {
    return redirectWithLocale(req, resolvedLocale, "/login");
  }

  if (role === UserRole.SUPER_ADMIN && pathname.startsWith("/school/dashboard")) {
    return redirectWithLocale(req, resolvedLocale, "/platform/dashboard");
  }

  if (matchesPath(pathname, "/school/dashboard")) {
    if (role === UserRole.TEACHER) {
      return redirectWithLocale(req, resolvedLocale, "/teacher/dashboard");
    }
    if (role === UserRole.STUDENT) {
      return redirectWithLocale(req, resolvedLocale, "/student/dashboard");
    }
  }

  if (matchesPath(pathname, "/platform")) {
    if (role !== UserRole.SUPER_ADMIN) {
      return redirectWithLocale(req, resolvedLocale, "/unauthorized");
    }
  }

  if (matchesPath(pathname, "/teacher")) {
    if (role !== UserRole.TEACHER) {
      return redirectWithLocale(req, resolvedLocale, "/unauthorized");
    }
    if (!schoolId) {
      return redirectWithLocale(req, resolvedLocale, "/unauthorized");
    }
  }

  if (matchesPath(pathname, "/student")) {
    if (role !== UserRole.STUDENT) {
      return redirectWithLocale(req, resolvedLocale, "/unauthorized");
    }
    if (!schoolId) {
      return redirectWithLocale(req, resolvedLocale, "/unauthorized");
    }
  }

  const schoolAdminOnlyPaths = [
    "/school/dashboard",
    "/school/analytics",
    "/school/students",
    "/school/staff",
    "/school/subjects",
    "/school/courses",
    "/school/classes",
    "/school/sections",
    "/school/enrollments",
    "/school/attendance",
    "/school/staff-attendance",
    "/school/timetable",
    "/school/invoices",
    "/school/payments",
    "/school/payroll",
    "/school/exports",
    "/school/settings",
  ];

  const isSchoolAdminRoute = schoolAdminOnlyPaths.some((route) =>
    matchesPath(pathname, route),
  );

  if (isSchoolAdminRoute) {
    if (
      role !== UserRole.SCHOOL_SUPER_ADMIN &&
      role !== UserRole.SCHOOL_ADMIN &&
      role !== UserRole.SUPER_ADMIN
    ) {
      return redirectWithLocale(req, resolvedLocale, "/unauthorized");
    }
    if (!schoolId) {
      return redirectWithLocale(req, resolvedLocale, "/unauthorized");
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
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
