'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isEmployee = userRole === 'EMPLOYEE';

  if (!session) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link href="/" className="navbar-brand">
          <i className="bi bi-clipboard2-pulse me-2"></i>
          PsychAssess
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Link per Admin */}
            {isAdmin && (
              <>
                <li className="nav-item">
                  <Link 
                    href="/admin" 
                    className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}
                  >
                    <i className="bi bi-speedometer2 me-1"></i>
                    Admin Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/admin/organizations" 
                    className={`nav-link ${pathname.startsWith('/admin/organizations') ? 'active' : ''}`}
                  >
                    <i className="bi bi-building me-1"></i>
                    Organizzazioni
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/admin/users" 
                    className={`nav-link ${pathname.startsWith('/admin/users') ? 'active' : ''}`}
                  >
                    <i className="bi bi-people me-1"></i>
                    Utenti
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/admin/tests" 
                    className={`nav-link ${pathname.startsWith('/admin/tests') ? 'active' : ''}`}
                  >
                    <i className="bi bi-clipboard-check me-1"></i>
                    Test
                  </Link>
                </li>
              </>
            )}
            
            {/* Link per Manager */}
            {isManager && (
              <>
                <li className="nav-item">
                  <Link 
                    href="/manager" 
                    className={`nav-link ${pathname === '/manager' ? 'active' : ''}`}
                  >
                    <i className="bi bi-speedometer2 me-1"></i>
                    Manager Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/manager/team" 
                    className={`nav-link ${pathname === '/manager/team' ? 'active' : ''}`}
                  >
                    <i className="bi bi-people me-1"></i>
                    Il Mio Team
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/manager/tests" 
                    className={`nav-link ${pathname === '/manager/tests' ? 'active' : ''}`}
                  >
                    <i className="bi bi-clipboard-data me-1"></i>
                    Test del Team
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/manager/analytics" 
                    className={`nav-link ${pathname === '/manager/analytics' ? 'active' : ''}`}
                  >
                    <i className="bi bi-graph-up me-1"></i>
                    Analytics
                  </Link>
                </li>
              </>
            )}
            
            {/* Link per Employee */}
            {isEmployee && (
              <>
                <li className="nav-item">
                  <Link 
                    href="/dashboard" 
                    className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
                  >
                    <i className="bi bi-house me-1"></i>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/tests" 
                    className={`nav-link ${pathname.startsWith('/tests') ? 'active' : ''}`}
                  >
                    <i className="bi bi-clipboard-check me-1"></i>
                    I Miei Test
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/reports" 
                    className={`nav-link ${pathname.startsWith('/reports') ? 'active' : ''}`}
                  >
                    <i className="bi bi-file-earmark-pdf me-1"></i>
                    I Miei Report
                  </Link>
                </li>
              </>
            )}
          </ul>
          
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a 
                className="nav-link dropdown-toggle" 
                href="#" 
                role="button" 
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle me-1"></i>
                {session.user?.name || session.user?.email}
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link href="/profile" className="dropdown-item">
                    <i className="bi bi-person me-2"></i>
                    Profilo
                  </Link>
                </li>
                {/* Link debug solo in development */}
                {process.env.NODE_ENV === 'development' && (
                  <li>
                    <Link href="/debug/roles" className="dropdown-item">
                      <i className="bi bi-bug me-2"></i>
                      Debug Ruoli
                    </Link>
                  </li>
                )}
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
} 