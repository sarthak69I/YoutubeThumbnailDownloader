'use client'

import React, { useState, useEffect } from 'react'
import VideoAnalyzer from '../components/VideoAnalyzer'
import FeatureSection from '../components/FeatureSection'
import FloatingNav from '../components/FloatingNav'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <>
      <div className="cyber-grid"></div>
      <FloatingNav />
      
      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <img 
                  src="https://i.postimg.cc/ZKGmmSyr/a5f7295b-f621-4163-b66d-8edadf7721d8-removebg-preview-1-1.webp"
                  alt="E-LEAKxDOWN Logo"
                  width="120"
                  height="120"
                  className="mb-4"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))' }}
                />
                <h1 className="hero-title">E-LEAKxDOWN</h1>
                <p className="hero-subtitle">
                  Ultimate YouTube Video & Audio Downloader with unlimited downloads, 
                  MP3 extraction, and cyberpunk-powered performance
                </p>
                
                {/* Search Section */}
                <VideoAnalyzer />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <FeatureSection />

        {/* Footer */}
        <footer className="text-center py-5 mt-5">
          <div className="container">
            <p className="text-muted mb-0">
              © 2025 E-LEAKxDOWN - Unlimited YouTube Downloads
            </p>
            <p className="text-muted small mt-2">
              Powered by Next.js & Cyberpunk Technology
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}