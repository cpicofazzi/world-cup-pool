import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()
  
  if (!user && !url.pathname.startsWith('/signup') && !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth')) {
    // If no user, redirect to signup
    url.pathname = '/signup'
    return NextResponse.redirect(url)
  }

  if (user && !url.pathname.startsWith('/payment-pending') && !url.pathname.startsWith('/auth')) {
    // Check approval status
    // The Venmo gate redirect is removed to allow unapproved users to view the app UI.
    // We handle the pending state visually in the app rather than a hard redirect.
  }

  return supabaseResponse
}
