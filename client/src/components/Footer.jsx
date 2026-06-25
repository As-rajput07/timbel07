import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import cosenLogo from '../assets/cosen_brand_logo.svg'

const footerLinks = [
  { name: 'Home', path: '/' },
  { name: 'Find Rooms', path: '/finder' },
  { name: 'Class Timetables', path: '/classes' },
  { name: 'Teacher Status', path: '/teachers' },
]

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-slate-border/30 bg-slate-deep/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={cosenLogo} alt="Cosen Logo" className="h-8 w-auto" />
              <span className="text-lg font-bold font-heading text-text-primary">
                Timetable Detector
              </span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              A proud product of the Cosen platform. Find free classrooms on campus instantly.
            </p>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-text-muted hover:text-violet-primary transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links Column */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
              Connect With Us
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <a href="https://www.instagram.com/cosen.hub?igsh=YmpiOTh4aWlxMjg3" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-text-muted hover:bg-violet-primary hover:text-white transition-all duration-300" title="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://whatsapp.com/channel/0029Va4dI6XKmCPJ1lc5Pa0L" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-text-muted hover:bg-emerald-free hover:text-white transition-all duration-300" title="WhatsApp Channel">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M16.5 14.5s-1.5 2-2.5 2-3-1.5-4-2.5-2.5-3-2.5-4 2-2.5 2-2.5 1-1 1.5-1 .5 1.5.5 1.5-.5 1-1 1.5.5 1.5 1.5 2.5 2.5 1.5 2.5 1.5 1.5-1 1.5-1 1.5.5 1.5.5-.5 1-.5 1z"/></svg>
              </a>
              <a href="https://www.linkedin.com/in/ankit-rajput-7969b0224?utm_source=share_via&amp;utm_content=profile&amp;utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-text-muted hover:bg-violet-primary hover:text-white transition-all duration-300" title="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              <a href="https://github.com/Ankitrajput07" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-text-muted hover:bg-gray-700 hover:text-white transition-all duration-300" title="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.1-.34 6.36-1.53 6.36-6.36a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.8 3.2 6.1 6.3 6.4a4.8 4.8 0 0 0-1 2.9v5"/><path d="M9 20a4 4 0 0 1-5-1.5"/></svg>
              </a>
              <a href="https://responsivewebsit07.netlify.app/#" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-800 text-text-muted hover:bg-indigo-500 hover:text-white transition-all duration-300" title="Developer Portfolio">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-slate-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © 2024 Cosen. All rights reserved.
          </p>
          <p className="text-xs text-text-muted flex items-center gap-1">
            Made with <Heart size={12} className="text-red-busy fill-red-busy" /> by the Cosen team
          </p>
        </div>
      </div>
    </footer>
  )
}
