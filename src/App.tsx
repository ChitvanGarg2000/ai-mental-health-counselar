import { lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route } from 'react-router-dom'
import { MotionPreferenceSync } from '@/components/motion-preference-sync'
import {
  HelpPageFallback,
  JournalPageFallback,
  SettingsPageFallback,
  ToolkitPageFallback,
} from '@/components/layout/page-shell'
import Conversation from './pages/Conversation.tsx'
import Home from './pages/Home.tsx'
import NotFound from './pages/NotFound.tsx'

const Journal = lazy(() => import('./pages/Journal.tsx'))
const Toolkit = lazy(() => import('./pages/Toolkit.tsx'))
const Settings = lazy(() => import('./pages/Settings.tsx'))
const Help = lazy(() => import('./pages/Help.tsx'))

function LazyRoute({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

function App() {
  return (
    <>
      <MotionPreferenceSync />
      <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/chat"
        element={<Conversation />}
      />
      <Route
        path="/chat/:sessionId"
        element={<Conversation />}
      />
      <Route
        path="/journal"
        element={
          <LazyRoute fallback={<JournalPageFallback />}>
            <Journal />
          </LazyRoute>
        }
      />
      <Route
        path="/toolkit"
        element={
          <LazyRoute fallback={<ToolkitPageFallback />}>
            <Toolkit />
          </LazyRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <LazyRoute fallback={<SettingsPageFallback />}>
            <Settings />
          </LazyRoute>
        }
      />
      <Route
        path="/help"
        element={
          <LazyRoute fallback={<HelpPageFallback />}>
            <Help />
          </LazyRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}

export default App
