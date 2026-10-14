import { metrics } from '../data'
import { useCountUp, useInView } from '../hooks'

function MetricCard({
  value,
  decimals = 0,
  suffix,
  unit,
  label,
  delta,
  deltaNeutral,
  active,
  index,
}: (typeof metrics)[number] & { active: boolean; index: number }) {
  const v = useCountUp(value, active, 1500 + index * 120, decimals)
  const shown = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
  return (
    <div className="card metric-card">
      <div className="metric-value">
        {shown}
        {suffix && <span className="unit">{suffix}</span>}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div className="metric-label">{label}</div>
      {delta && <span className={`metric-delta ${deltaNeutral ? 'neutral' : ''}`}>{delta}</span>}
    </div>
  )
}

export default function Metrics() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  return (
    <section className="metrics">
      <div className="container">
        <div className="metrics-grid" ref={ref}>
          {metrics.map((m, i) => (
            <MetricCard key={m.label} {...m} active={inView} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
