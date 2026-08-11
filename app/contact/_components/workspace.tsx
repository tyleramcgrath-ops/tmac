'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { LogOut, RotateCcw, Sparkles, Users, Mail } from 'lucide-react'
import { useStore } from '../_lib/store'
import { BriefView } from './brief-view'
import { PeopleView } from './people-view'
import { DraftsView } from './drafts-view'
import { DraftDrawer, type DraftTarget } from './draft-drawer'
import { Avatar, SkeletonLine, Wordmark } from './primitives'

type Tab = 'brief' | 'people' | 'drafts'

const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: 'brief', label: 'Brief', icon: Sparkles },
  { id: 'people', label: 'People', icon: Users },
  { id: 'drafts', label: 'Drafts', icon: Mail },
]

export function Workspace() {
  const { account, ready, drafts, people, signOut, resetDemo } = useStore()
  const [tab, setTab] = useState<Tab>('brief')
  const [target, setTarget] = useState<DraftTarget | null>(null)
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

  const unsent = drafts.filter((draft) => !draft.sent).length

  return (
    <div className="ctc-app">
      <a href="#workspace-main" className="ctc-skip">
        Skip to content
      </a>

      <header className="ctc-appbar">
        <div className="ctc-appbar-inner">
          <Link href="/contact" aria-label="Contact — home" style={{ textDecoration: 'none' }}>
            <Wordmark size={18} />
          </Link>

          <nav aria-label="Workspace sections" className="ctc-tabs">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="ctc-tab"
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => setTab(item.id)}
              >
                <item.icon size={14} aria-hidden="true" />
                <span>{item.label}</span>
                {item.id === 'people' ? (
                  <span className="ctc-num ctc-tab-count">{people.length}</span>
                ) : null}
                {item.id === 'drafts' && unsent > 0 ? (
                  <span className="ctc-num ctc-tab-count ctc-tab-count-ember">{unsent}</span>
                ) : null}
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
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <Avatar name={account.name} size="sm" />
                  <span className="ctc-account-name ctc-truncate">{account.name}</span>
                </button>
                {menuOpen ? (
                  <div className="ctc-menu ctc-pop" role="menu">
                    <div className="ctc-menu-head">
                      <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>{account.name}</span>
                      <span className="ctc-faint ctc-truncate" style={{ fontSize: 'var(--t-xs)' }}>
                        {account.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="ctc-menu-item"
                      onClick={() => {
                        resetDemo()
                        setMenuOpen(false)
                      }}
                    >
                      <RotateCcw size={13} aria-hidden="true" /> Reset the demo data
                    </button>
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
                <span className="ctc-chip ctc-chip-mono ctc-guest-chip">Guest</span>
                <Link href="/contact/signup" className="ctc-btn ctc-btn-primary ctc-btn-sm">
                  Save my work
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
          ) : tab === 'brief' ? (
            <BriefView onDraft={setTarget} />
          ) : tab === 'people' ? (
            <PeopleView onDraft={setTarget} />
          ) : (
            <DraftsView />
          )}
        </div>
      </main>

      {target ? <DraftDrawer target={target} onClose={() => setTarget(null)} /> : null}
    </div>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="ctc-stack ctc-g5" aria-busy="true" aria-label="Loading your workspace">
      <div className="ctc-composer">
        <div className="ctc-composer-inner ctc-stack ctc-g3">
          <SkeletonLine w={140} h={10} />
          <SkeletonLine w="52%" h={30} />
          <SkeletonLine w="80%" h={12} />
          <SkeletonLine w="100%" h={78} />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="ctc-pick" style={{ opacity: 1 - i * 0.22 }}>
          <div className="ctc-pick-rail">
            <SkeletonLine w={18} h={10} />
            <span className="ctc-skeleton" style={{ width: 54, height: 54, borderRadius: '50%' }} />
          </div>
          <div className="ctc-pick-main ctc-stack ctc-g3">
            <SkeletonLine w="30%" h={13} />
            <SkeletonLine w="66%" h={20} />
            <SkeletonLine w="92%" h={11} />
            <SkeletonLine w="74%" h={11} />
          </div>
        </div>
      ))}
    </div>
  )
}
