import Nav from './components/Nav'
import Hero from './components/Hero'
import Metrics from './components/Metrics'
import Architecture from './components/Architecture'
import Features from './components/Features'
import Pipeline from './components/Pipeline'
import Demo from './components/Demo'
import Benchmark from './components/Benchmark'
import Footer from './components/Footer'

export default function App() {
  // ?flat 用于整页截图验收:禁用 100vh 与入场动画
  const flat =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('flat')
  return (
    <div className={flat ? 'flat' : undefined}>
      <Nav />
      <main>
        <Hero />
        <Metrics />
        <Architecture />
        <Features />
        <Pipeline />
        <Demo />
        <Benchmark />
      </main>
      <Footer />
    </div>
  )
}
