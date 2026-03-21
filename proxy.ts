import { withAuth } from "next-auth/middleware";

const proxy = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default proxy;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/classes/:path*",
    "/attendance/:path*",
    "/payments/:path*",
    "/teachers/:path*",
    "/settings/:path*",
  ],
};
