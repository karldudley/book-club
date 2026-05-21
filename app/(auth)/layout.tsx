export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen paper-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
