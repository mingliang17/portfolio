import React from 'react';
import { assetPath } from '../utils/assetPath.js';

const socialLinks = [
  { name: 'GitHub', icon: 'github.svg', href: 'https://github.com/yourusername' },
  { name: 'Twitter', icon: 'twitter.svg', href: 'https://twitter.com/yourusername' },
  { name: 'Instagram', icon: 'instagram.svg', href: 'https://instagram.com/yourusername' },
];

const Footer = () => {
  return (
    <footer style={{
      padding: '3rem 1.25rem 1rem 1.25rem',
      borderTop: '1px solid var(--color-black-300)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1.25rem'
    }}>
      {/* Terms & Privacy */}
      <div style={{
        color: 'var(--color-white-500)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <p style={{ cursor: 'pointer', textDecoration: 'underline' }}>Terms & Conditions</p>
        <span>|</span>
        <p style={{ cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</p>
      </div>

      {/* Social Icons & Copyright */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '1rem',
        justifyContent: 'center'
      }}>
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon"
            style={{ width: '1.5rem', height: '1.5rem' }}
          >
            <img
              src={assetPath(`/assets/${link.icon}`)}
              alt={link.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </a>
        ))}

        <p style={{
          color: 'var(--color-white-500)',
          fontSize: '0.875rem',
          marginTop: '0.5rem',
          textAlign: 'center'
        }}>
          © 2025 Ming Liang. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;