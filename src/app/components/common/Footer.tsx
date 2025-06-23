import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer mt-auto py-5 bg-dark text-light">
      <div className="container">
        <div className="row gy-4">
          <div className="col-lg-4 col-md-6">
            <h5 className="text-white mb-3 d-flex align-items-center">
              <i className="bi bi-braces me-2"></i>
              PsychAssess
            </h5>
            <p className="text-white-50 mb-4">
              Empowering mental health professionals and individuals with research-backed psychological assessments.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-decoration-none" aria-label="LinkedIn">
                <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-linkedin text-white"></i>
                </div>
              </a>
              <a href="#" className="text-decoration-none" aria-label="Twitter">
                <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-twitter-x text-white"></i>
                </div>
              </a>
              <a href="#" className="text-decoration-none" aria-label="Email">
                <div className="bg-primary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-envelope text-white"></i>
                </div>
              </a>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white mb-3">Quick Links</h6>
            <ul className="list-unstyled footer-links">
              <li className="mb-2"><Link href="/" className="text-white-50 text-decoration-none hover-white">Home</Link></li>
              <li className="mb-2"><Link href="/tests" className="text-white-50 text-decoration-none hover-white">All Tests</Link></li>
              <li className="mb-2"><Link href="/about" className="text-white-50 text-decoration-none hover-white">About Us</Link></li>
              <li className="mb-2"><Link href="/contact" className="text-white-50 text-decoration-none hover-white">Contact</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white mb-3">Test Categories</h6>
            <ul className="list-unstyled footer-links">
              <li className="mb-2"><Link href="/tests?category=personality" className="text-white-50 text-decoration-none hover-white">Personality</Link></li>
              <li className="mb-2"><Link href="/tests?category=cognitive" className="text-white-50 text-decoration-none hover-white">Cognitive</Link></li>
              <li className="mb-2"><Link href="/tests?category=anxiety" className="text-white-50 text-decoration-none hover-white">Anxiety</Link></li>
              <li className="mb-2"><Link href="/tests?category=depression" className="text-white-50 text-decoration-none hover-white">Depression</Link></li>
            </ul>
          </div>
          
          <div className="col-lg-4 col-md-6">
            <h6 className="text-white mb-3">Stay Updated</h6>
            <p className="text-white-50 mb-3">Subscribe to our newsletter for the latest psychological research and test updates.</p>
            <div className="input-group mb-3">
              <input type="email" className="form-control" placeholder="Your email address" aria-label="Email address" />
              <button className="btn btn-primary" type="button">Subscribe</button>
            </div>
          </div>
        </div>
        
        <hr className="mt-4 mb-4 border-secondary" />
        
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <p className="mb-0 text-white-50">
              &copy; {currentYear} PsychAssess. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 mt-3 mt-md-0">
            <ul className="list-inline text-center text-md-end mb-0">
              <li className="list-inline-item">
                <Link href="/privacy" className="text-white-50 text-decoration-none hover-white">Privacy Policy</Link>
              </li>
              <li className="list-inline-item ms-3">
                <Link href="/terms" className="text-white-50 text-decoration-none hover-white">Terms of Service</Link>
              </li>
              <li className="list-inline-item ms-3">
                <Link href="/cookies" className="text-white-50 text-decoration-none hover-white">Cookies</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 