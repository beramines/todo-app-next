import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ローカル環境またはngrokの場合は認証をスキップ
  const host = request.headers.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('ngrok')) {
    return NextResponse.next();
  }
  
  // Vercelのプレビュー環境のみBasic認証を有効にする
  if (process.env.VERCEL_ENV === 'preview') {
    const basicAuth = request.headers.get('authorization');

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1];
      const [user, password] = atob(authValue).split(':');

      // 環境変数から認証情報を取得
      const basicAuthUser = process.env.BASIC_AUTH_USER || 'test';
      const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD || '##test!!';
      
      if (user === basicAuthUser && password === basicAuthPassword) {
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
