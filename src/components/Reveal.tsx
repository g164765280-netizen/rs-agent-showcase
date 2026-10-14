import { ReactNode } from 'react'
import { useInView } from '../hooks'

interface Props {
  children: ReactNode
  delay?: number
  className?: string
}

/** 滚动进入视口时淡入上移 */
export default function Reveal({ children, delay = 0, className = '' }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12)
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'in-view' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
