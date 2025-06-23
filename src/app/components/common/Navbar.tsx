'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAdmin } from './SessionProvider';
import AdminGuard from './AdminGuard';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  
  // Use the admin context
  const { isAdmin, isManager, isEmployee, userRole, isLoading } = useAdmin();

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    router.push('/auth/logout');
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
  };

  // Render a placeholder or loading state while session is loading
  if (isLoading) {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center">
            <i className="bi bi-braces me-2"></i>
            <span className="fw-bold">PsychAssess</span>
          </Link>
          <div className="navbar-text ms-auto text-light">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            Caricamento...
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
      <div className="container">
        <Link href={session ? "/dashboard" : "/"} className="navbar-brand d-flex align-items-center">
          <i className="bi bi-braces me-2"></i>
          <span className="fw-bold">PsychAssess</span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="navbarNav"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto">
            {session ? (
              <>
                <li className="nav-item">
                  <Link 
                    href="/dashboard" 
                    className={`nav-link px-3 ${pathname === '/dashboard' ? 'active fw-bold' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/tests" 
                    className={`nav-link px-3 ${pathname.startsWith('/tests') ? 'active fw-bold' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="bi bi-clipboard-check me-1"></i> Test
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/reports" 
                    className={`nav-link px-3 ${pathname.startsWith('/reports') ? 'active fw-bold' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="bi bi-file-earmark-text me-1"></i> Report
                  </Link>
                </li>
                {isAdmin && (
                  <li className="nav-item">
                    <Link 
                      href="/admin" 
                      className={`nav-link px-3 ${pathname.startsWith('/admin') ? 'active fw-bold' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="bi bi-shield-lock me-1"></i> Admin
                    </Link>
                  </li>
                )}
                {isManager && (
                  <li className="nav-item">
                    <Link 
                      href="/manager" 
                      className={`nav-link px-3 ${pathname.startsWith('/manager') ? 'active fw-bold' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <i className="bi bi-people-fill me-1"></i> Manager
                    </Link>
                  </li>
                )}
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link 
                    href="/" 
                    className={`nav-link px-3 ${pathname === '/' ? 'active fw-bold' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="bi bi-house-door me-1"></i> Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/about" 
                    className={`nav-link px-3 ${pathname === '/about' ? 'active fw-bold' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="bi bi-info-circle me-1"></i> Chi Siamo
                  </Link>
                </li>
              </>
            )}
          </ul>
          <ul className="navbar-nav ms-auto">
            {session ? (
              <>
                <li className="nav-item dropdown" ref={dropdownRef}>
                  <a 
                    className="nav-link dropdown-toggle d-flex align-items-center" 
                    href="#" 
                    id="navbarDropdown" 
                    role="button" 
                    onClick={toggleDropdown}
                    aria-expanded={dropdownOpen}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center me-2" 
                         style={{ width: '30px', height: '30px', fontSize: '14px' }}>
                      {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                    </div>
                    <span className="d-none d-md-inline">{session.user?.name || 'User'}</span>
                  </a>
                  <ul className={`dropdown-menu dropdown-menu-end shadow ${dropdownOpen ? 'show' : ''}`} 
                      aria-labelledby="navbarDropdown"
                      style={{ position: 'absolute', inset: '0px 0px auto auto', margin: '0px', transform: 'translate(0px, 40px)' }}>
                    <li>
                      <Link 
                        className="dropdown-item" 
                        href="/profile" 
                        onClick={() => {
                          setIsOpen(false);
                          setDropdownOpen(false);
                        }}
                      >
                        <i className="bi bi-person me-2"></i>Profilo
                      </Link>
                    </li>
                    <li>
                      <Link 
                        className="dropdown-item" 
                        href="/profile?tab=tests" 
                        onClick={() => {
                          setIsOpen(false);
                          setDropdownOpen(false);
                        }}
                      >
                        <i className="bi bi-clipboard-data me-2"></i>I miei Test
                      </Link>
                    </li>
                    <li>
                      <Link 
                        className="dropdown-item" 
                        href="/profile?tab=reports" 
                        onClick={() => {
                          setIsOpen(false);
                          setDropdownOpen(false);
                        }}
                      >
                        <i className="bi bi-file-earmark-text me-2"></i>Archivio Report
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        onClick={() => {
                          handleLogout();
                          setDropdownOpen(false);
                        }} 
                        className="dropdown-item text-danger"
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item dropdown">
                  <a 
                    className="nav-link dropdown-toggle" 
                    href="#" 
                    role="button" 
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-plus me-1"></i> Registrati
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <Link 
                        href="/auth/register" 
                        className="dropdown-item"
                        onClick={() => setIsOpen(false)}
                      >
                        <i className="bi bi-person-badge me-2"></i>
                        Come Dipendente
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <span className="dropdown-item-text text-muted">
                        <small>Hai bisogno di un account aziendale? Contatta il tuo HR</small>
                      </span>
                    </li>
                  </ul>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/auth/login" 
                    className="btn btn-outline-light ms-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <i className="bi bi-box-arrow-in-right me-1"></i> Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
} 