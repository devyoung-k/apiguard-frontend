import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/projects', '/alerts', '/settings'];
const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // localStorage는 미들웨어(Edge)에서 접근 불가하므로 쿠키 대신
  // 클라이언트 사이드에서 AuthProvider가 인증 체크를 담당합니다.
  // 여기서는 경로 기반 기본 리다이렉트만 처리합니다.

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAuth = authPaths.some((path) => pathname.startsWith(path));

  // 루트 경로 → 로그인으로
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 보호된 경로와 인증 경로 모두 통과 (클라이언트에서 AuthProvider가 처리)
  if (isProtected || isAuth) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
