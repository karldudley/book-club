import { SketchDivider } from '@/components/ui/dogear'

/**
 * Shown while the book page's queries run. The book page may also hit Google
 * Books to backfill a missing description, so this can be on screen for a
 * moment — it mirrors the real layout so nothing jumps when content lands.
 */
export default function Loading() {
  return (
    <div className="skeleton-page">
      <div className="skeleton-line" style={{ width: 120, height: 11, marginBottom: 18 }} />

      <div className="card py-6 px-6 sm:px-7 mb-6">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 items-start">
          <div className="skeleton-block" style={{ width: 112, height: 168, borderRadius: 2 }} />
          <div className="flex-1 min-w-0 w-full">
            <div className="skeleton-line" style={{ width: '70%', height: 34 }} />
            <div className="skeleton-line" style={{ width: '40%', height: 16, marginTop: 12 }} />
            <div className="flex flex-wrap gap-2 mt-5">
              <div className="skeleton-line" style={{ width: 90, height: 22, borderRadius: 999 }} />
              <div className="skeleton-line" style={{ width: 70, height: 22, borderRadius: 999 }} />
            </div>
            <div className="flex flex-wrap gap-6 mt-5">
              <div className="skeleton-line" style={{ width: 72, height: 30 }} />
              <div className="skeleton-line" style={{ width: 96, height: 30 }} />
              <div className="skeleton-line" style={{ width: 80, height: 30 }} />
            </div>
          </div>
        </div>
      </div>

      <SketchDivider />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-6">
        <div className="flex flex-col gap-6">
          <section className="card p-7">
            <div className="skeleton-line" style={{ width: 90, height: 10 }} />
            <div className="skeleton-line" style={{ width: 190, height: 24, marginTop: 10, marginBottom: 20 }} />
            {[96, 100, 88, 94, 60].map((w, i) => (
              <div key={i} className="skeleton-line" style={{ width: `${w}%`, height: 13, marginBottom: 10 }} />
            ))}
          </section>

          <section className="card p-7">
            <div className="skeleton-line" style={{ width: 120, height: 10 }} />
            <div className="skeleton-line" style={{ width: 150, height: 24, marginTop: 10, marginBottom: 20 }} />
            <div className="skeleton-block" style={{ height: 78, borderRadius: 6, marginBottom: 20 }} />
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="skeleton-block" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div className="skeleton-line" style={{ width: 110, height: 13 }} />
                </div>
                <div className="skeleton-line" style={{ width: 58, height: 13 }} />
              </div>
            ))}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="card p-6">
            <div className="skeleton-line" style={{ width: 80, height: 10 }} />
            <div className="skeleton-line" style={{ width: 110, height: 22, marginTop: 10, marginBottom: 18 }} />
            <div className="skeleton-line" style={{ width: 140, height: 32, borderRadius: 8 }} />
          </section>
          <section className="card p-6">
            <div className="skeleton-line" style={{ width: 100, height: 10 }} />
            <div className="skeleton-line" style={{ width: 90, height: 22, marginTop: 10, marginBottom: 18 }} />
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton-line" style={{ width: '100%', height: 13, marginBottom: 12 }} />
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
