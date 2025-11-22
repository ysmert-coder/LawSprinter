import Navbar from './components/navbar'
import Hero from './components/hero'
import Features from './components/features'
import HowItWorks from './components/how-it-works'
import Modules from './components/modules'
import Security from './components/security'
import About from './components/about'
import Pricing from './components/pricing'
import FAQ from './components/faq'
import Contact from './components/contact'
import Footer from './components/footer'

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Modules />
        <Security />
        <About />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

