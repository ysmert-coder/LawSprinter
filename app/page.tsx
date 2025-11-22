'use client'

import Navbar from './(marketing)/components/navbar'
import Hero from './(marketing)/components/hero'
import Features from './(marketing)/components/features'
import HowItWorks from './(marketing)/components/how-it-works'
import Modules from './(marketing)/components/modules'
import Security from './(marketing)/components/security'
import About from './(marketing)/components/about'
import Pricing from './(marketing)/components/pricing'
import FAQ from './(marketing)/components/faq'
import Contact from './(marketing)/components/contact'
import Footer from './(marketing)/components/footer'

export default function HomePage() {
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

