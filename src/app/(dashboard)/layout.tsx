import Sidebar from '@/components/sidebar'
import MobileBottomBar from '@/components/mobile-bottom-bar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomBar />
    </div>
  )
}
