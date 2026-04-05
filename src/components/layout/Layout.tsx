import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-base">
      <Header />
      <main className="pt-16">{children}</main>
    </div>
  )
}
