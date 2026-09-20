import { SketchDivider } from '@/components/ui/dogear'

export default function Loading() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-line" style={{ width: 120, height: 11, marginBottom: 18 }} />

      <div className="card py-6 px-6 sm:px-7 mb-6">
        <div className="skeleton-line" style={{ width: 110, height: 10 }} />
        <div className="skeleton-line" style={{ width: '55%', height: 40, marginTop: 12 }} />
        <div className="skeleton-line" style={{ width: '38%', height: 15, marginTop: 14 }} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton-block" style={{ height: 96, borderRadius: 'var(--r-md)' }} />
        ))}
      </div>

      <SketchDivider />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {[0, 1, 2, 3].map(i => (
          <section key={i} className="card p-7">
            <div className="skeleton-line" style={{ width: 100, height: 10 }} />
            <div className="skeleton-line" style={{ width: 170, height: 24, marginTop: 10, marginBottom: 18 }} />
            {[0, 1, 2, 3].map(r => (
              <div key={r} className="flex items-center gap-3 py-2.5">
                <div className="skeleton-line" style={{ width: 14, height: 12 }} />
                <div className="flex-1">
                  <div className="skeleton-line" style={{ width: '62%', height: 14 }} />
                  <div className="skeleton-line" style={{ width: 62, height: 10, marginTop: 6 }} />
                </div>
                <div className="skeleton-line" style={{ width: 44, height: 18 }} />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
