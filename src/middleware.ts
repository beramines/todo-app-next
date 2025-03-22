import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 開発環境でのみBasic認証を有効にする
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
    const basicAuth = request.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, password] = atob(authValue).split(':');

      if (user === 'test' && password === '##test!!') {
        return NextResponse.next();
      }
    }

    // 認証が無効な場合、Basic認証を要求
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}

// Basic認証を適用するパス
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
