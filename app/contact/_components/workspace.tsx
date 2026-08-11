'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { History, LogOut, Radar } from 'lucide-react'
import { useStore } from '../_lib/store'
import { Scanner } from './scanner'
import { HistoryView } from './history-view'
import { ProbeDrawer, type ProbeTarget } from './probe-drawer'
import { SavedScanView } from './saved-scan-view'
import { SkeletonLine, Wordmark } from './primitives'
import type { Scan } from '../_lib/types'

type Tab = 'scan' | 'history'

export function Workspace() {
  const { account, ready, scans, signOut } = useStore()
  const [tab, setTab] = useState<Tab>('scan')
  const [target, setTarget] = useState<ProbeTarget | null>(null)
  const [viewing, setViewing] = useState<Scan | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const TABS: { id: Tab; label: string; icon: typeof Radar; count?: number }[] = [
    { id: 'scan', label: 'Scanner', icon: Radar },
    { id: 'history', label: 'Saved', icon: History, count: scans.length },
  ]

  return (
    <div className="ctc-app">
      <a href="#workspace-main" className="ctc-skip">
        Skip to content
      </a>

      <header className="ctc-appbar">
        <div className="ctc-appbar-inner">
          <Link href="/contact" aria-label="Contact Studios — home" style={{ textDecoration: 'none' }}>
            <Wordmark size={18} />
          </Link>

          <nav aria-label="Workspace sections" className="ctc-tabs">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="ctc-tab"
                aria-current={tab === item.id && !viewing ? 'page' : undefined}
                onClick={() => {
                  setViewing(null)
                  setTab(item.id)
                }}
              >
                <item.icon size={14} aria-hidden="true" />
                <span>{item.label}</span>
                {item.count ? <span className="ctc-num ctc-tab-count">{item.count}</span> : null}
              </button>
            ))}
          </nav>

          <div className="ctc-account" ref={menuRef}>
            {!ready ? (
              <SkeletonLine w={120} h={30} />
            ) : account ? (
              <>
                <button
                  type="button"
                  className="ctc-account-btn"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((value) => !value)}
                >
                  <span className="ctc-account-dot" aria-hidden="true" />
                  <span className="ctc-account-name ctc-truncate">{account.name}</span>
                </button>
                {menuOpen ? (
                  <div className="ctc-menu ctc-pop" role="menu">
                    <div className="ctc-menu-head">
                      <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>{account.name}</span>
                      <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-xs)' }}>
                        {account.company || account.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="ctc-menu-item"
                      onClick={() => {
                        signOut()
                        setMenuOpen(false)
                      }}
                    >
                      <LogOut size={13} aria-hidden="true" /> Sign out
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="ctc-row ctc-g2">
                <span className="ctc-chip ctc-chip-mono">Guest</span>
                <Link href="/contact/signup" className="ctc-btn ctc-btn-solid ctc-btn-sm">
                  Save my scans
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="workspace-main" className="ctc-appmain">
        <div className="ctc-app-wrap">
          {!ready ? (
            <WorkspaceSkeleton />
          ) : viewing ? (
            <SavedScanView
              scan={viewing}
              onBack={() => setViewing(null)}
              onOpenProbe={(probe) => setTarget({ probe, brand: viewing.input.brand })}
            />
          ) : tab === 'scan' ? (
            <Scanner onOpenProbe={(probe, brand) => setTarget({ probe, brand })} />
          ) : (
            <HistoryView onOpen={setViewing} onNewScan={() => setTab('scan')} />
          )}
        </div>
      </main>

      {target ? <ProbeDrawer target={target} onClose={() => setTarget(null)} /> : null}
    </div>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="ctc-stack ctc-g5" aria-busy="true" aria-label="Loading the scanner">
      <div className="ctc-scanform">
        <div className="ctc-scanform-inner ctc-stack ctc-g3">
          <SkeletonLine w={150} h={10} />
          <SkeletonLine w="56%" h={32} />
          <SkeletonLine w="78%" h={12} />
          <SkeletonLine w="100%" h={64} />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="ctc-probe ctc-probe-waiting" style={{ opacity: 1 - i * 0.22 }}>
          <span className="ctc-probe-state">
            <span className="ctc-probe-queue" />
          </span>
          <div className="ctc-stack ctc-g2 ctc-grow">
            <SkeletonLine w={`${70 - i * 10}%`} h={14} />
            <SkeletonLine w="34%" h={10} />
          </div>
        </div>
      ))}
    </div>
  )
}
