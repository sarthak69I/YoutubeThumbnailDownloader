'use client'

import React from 'react'

export default function FeatureSection() {
  const features = [
    {
      icon: 'fas fa-infinity',
      title: 'Unlimited Downloads',
      description: 'Download as many YouTube videos as you want without any restrictions or limits'
    },
    {
      icon: 'fas fa-headphones',
      title: 'MP3 Audio Extraction',
      description: 'Extract high-quality MP3 audio from any YouTube video with 192kbps quality'
    },
    {
      icon: 'fas fa-image',
      title: 'Thumbnail Downloads',
      description: 'Download video thumbnails in multiple qualities up to 1280x720 resolution'
    },
    {
      icon: 'fas fa-bolt',
      title: 'Lightning Fast',
      description: 'Powered by yt-dlp for reliable and fast YouTube content extraction'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Mobile Optimized',
      description: 'Fully responsive design that works perfectly on all devices and screen sizes'
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Secure & Private',
      description: 'Your downloads are processed securely with no data stored or tracked'
    }
  ]

  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center mb-5">
          <div className="col-lg-8 text-center">
            <h2 className="display-4 fw-bold mb-4">
              <span style={{
                background: 'linear-gradient(135deg, var(--neon-purple), var(--neon-pink))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Cyberpunk Features
              </span>
            </h2>
            <p className="lead text-secondary">
              Advanced technology meets unlimited downloading power
            </p>
          </div>
        </div>
        
        <div className="row g-4">
          {features.map((feature, index) => (
            <div key={index} className="col-md-6 col-lg-4">
              <div 
                className="feature-card h-100"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <i className={`${feature.icon} feature-icon`}></i>
                <h4 className="fw-bold mb-3">{feature.title}</h4>
                <p className="text-secondary mb-0">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}