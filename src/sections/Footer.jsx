import React from 'react';
import { assetPath } from '../utils/assetPath.js';

const socialLinks = [
  { name: 'GitHub', icon: 'github.svg', href: 'https://github.com/yourusername' },
  { name: 'Twitter', icon: 'twitter.svg', href: 'https://twitter.com/yourusername' },
  { name: 'Instagram', icon: 'instagram.svg', href: 'https://instagram.com/yourusername' },
];

const Footer = () => {
  return (
    <footer className="footer-container">
      {/* Terms & Privacy */}
      <div className="footer-links">
        <p className="footer-link">Terms & Conditions</p>
        <span>|</span>
        <p className="footer-link">Privacy Policy</p>
      </div>

      {/* Social Icons & Copyright */}
      <div className="footer-socials">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon footer-social-icon"
          >
            <img
              src={assetPath(`/assets/${link.icon}`)}
              alt={link.name}
              className="footer-social-img"
            />
          </a>
        ))}

        <p className="footer-copyright">
          © 2025 Ming Liang. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;