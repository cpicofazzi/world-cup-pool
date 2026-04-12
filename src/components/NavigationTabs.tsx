'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavigationTabs({ poolId }: { poolId?: string }) {
  const pathname = usePathname()
  
  // If we are looking at a specific pool or leaderboard, use that poolId. 
  // For a generic user, this might be null.
  const query = poolId ? `?poolId=${poolId}` : ''

  const links = [
    { name: 'Dashboard', href: '/' },
    { name: 'Pool Leaderboard', href: `/leaderboard${query}` },
    { name: 'Scores', href: '/scores' },
    { name: 'Rules', href: '/rules' },
    { name: 'Admin', href: '/admin' },
  ]

  return (
    <div className="bg-brand-navy border-t border-brand-navy/80 sticky top-0 z-40 shadow-sm border-b border-border-subtle/20">
      <div className="max-w-6xl mx-auto flex overflow-x-auto custom-scrollbar">
        {links.map((link) => {
          const isActive = pathname === link.href || (pathname === '/leaderboard' && link.name === 'Pool Leaderboard')
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`whitespace-nowrap px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex-shrink-0 ${
                isActive
                  ? 'border-brand-gold text-brand-gold'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
