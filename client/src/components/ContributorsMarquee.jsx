import React from 'react';

const CONTRIBUTORS = [
  { 
    initials: 'AR', 
    name: 'Ankit Rajput', 
    role: 'Founder & Tech Lead',
    image: 'https://res.cloudinary.com/dga14nmzn/image/upload/v1783225764/ankit_rajput2_pzdeex.png'
  },
  { 
    initials: 'VR', 
    name: 'Vansh Ranka', 
    role: 'Data Analyst',
    image: 'https://res.cloudinary.com/dga14nmzn/image/upload/v1783226332/vansh_vmkvjw.jpg'
  },
  { 
    initials: 'PS', 
    name: 'Prafull Mayank Singh', 
    role: 'Data Analyst & Data Collector',
    image: 'https://res.cloudinary.com/dga14nmzn/image/upload/v1783226764/Screenshot_2026-07-05_101523_hyffrm.png'
  },
  { 
    initials: 'KM', 
    name: 'Kshitij Muni', 
    role: 'Contributor',
    image: 'https://res.cloudinary.com/dga14nmzn/image/upload/v1783581518/kshitige_nfrb1d.jpg'
  },
  { 
    initials: 'JV', 
    name: 'Jeet Vyas', 
    role: 'Contributor',
    image: 'https://res.cloudinary.com/dga14nmzn/image/upload/v1783582166/un-non_sbkg1x.png'
  },
];

export default function ContributorsMarquee() {
  const handleClick = () => {
    window.location.href = '/contributors.html';
  };

  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid rgba(51,65,85,0.3)', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#635BFF', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>The Team</p>
        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: '#F8FAFC', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.1 }}>
          Meet our <span style={{ background: 'linear-gradient(125deg, #635BFF, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Contributors</span>
        </h2>
      </div>

      <style>{`
        .contributor-marquee-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .contributor-marquee {
          position: relative;
          width: 100%;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
        }

        .contributor-marquee-track {
          display: flex;
          width: max-content;
          gap: 24px;
          animation: scroll-left-marquee 36s linear infinite;
        }

        .contributor-marquee:hover .contributor-marquee-track {
          animation-play-state: paused;
        }

        @keyframes scroll-left-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .contributor-card {
          flex: 0 0 auto;
          width: 280px;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(51, 65, 85, 0.4);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
          cursor: pointer;
        }

        .contributor-card:hover {
          border-color: rgba(99, 91, 255, 0.4);
          box-shadow: 0 20px 60px rgba(99, 91, 255, 0.12);
          transform: translateY(-6px);
          background: rgba(99, 91, 255, 0.06);
        }

        .contributor-avatar {
          width: 88px;
          height: 88px;
          border-radius: 9999px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 800;
          color: #fff;
          background: rgba(99, 91, 255, 0.12);
          border: 1px solid rgba(99, 91, 255, 0.22);
          box-shadow: 0 0 20px rgba(99, 91, 255, 0.1) inset;
        }

        .contributor-name {
          font-size: 22px;
          font-weight: 700;
          line-height: 1.3;
          color: #F8FAFC;
          margin-bottom: 6px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .contributor-role {
          font-size: 15px;
          font-weight: 500;
          color: #94A3B8;
        }
      `}</style>

      <div className="contributor-marquee-wrapper">
        <div className="contributor-marquee">
          <div className="contributor-marquee-track">
            {/* We duplicate the array 4 times to ensure it fills ultra-wide screens and scrolls infinitely */}
            {[...CONTRIBUTORS, ...CONTRIBUTORS, ...CONTRIBUTORS, ...CONTRIBUTORS].map((c, i) => (
              <div key={i} className="contributor-card" onClick={handleClick}>
                <div className="contributor-avatar">
                  {c.image ? (
                    <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    c.initials
                  )}
                </div>
                <div className="contributor-name">{c.name}</div>
                <div className="contributor-role">{c.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
