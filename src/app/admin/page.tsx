'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  if (status === 'loading' || session?.user?.role !== 'ADMIN') {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Caricamento...</span>
          </div>
        </div>
      </div>
    );
  }

  const adminSections = [
    {
      title: 'Organizzazioni',
      icon: 'bi-building',
      description: 'Gestisci le organizzazioni e genera codici azienda',
      link: '/admin/organizations',
      color: 'primary'
    },
    {
      title: 'Utenti',
      icon: 'bi-people',
      description: 'Visualizza e gestisci tutti gli utenti del sistema',
      link: '/admin/users',
      color: 'success'
    },
    {
      title: 'Manager',
      icon: 'bi-person-badge',
      description: 'Crea e gestisci account manager',
      link: '/admin/managers',
      color: 'warning'
    },
    {
      title: 'Report',
      icon: 'bi-file-earmark-text',
      description: 'Visualizza tutti i report e risultati dei test',
      link: '/admin/reports',
      color: 'info'
    },
    {
      title: 'Team',
      icon: 'bi-diagram-3',
      description: 'Gestisci i team delle organizzazioni',
      link: '/admin/teams',
      color: 'secondary'
    },
    {
      title: 'Test Psicologici',
      icon: 'bi-clipboard-check',
      description: 'Gestisci e crea test psicologici',
      link: '/tests/manage',
      color: 'purple'
    },
    {
      title: 'Generatore Test',
      icon: 'bi-magic',
      description: 'Genera test con intelligenza artificiale',
      link: '/tests/generator',
      color: 'indigo'
    },
    {
      title: 'Statistiche',
      icon: 'bi-graph-up',
      description: 'Visualizza statistiche e analytics',
      link: '/admin/stats',
      color: 'danger'
    }
  ];

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Pannello Amministrazione</h1>
          <p className="text-muted">Benvenuto, {session.user.name || session.user.email}</p>
        </div>
      </div>

      <div className="row g-4">
        {adminSections.map((section, index) => (
          <div key={index} className="col-md-6 col-lg-4">
            <Link href={section.link} className="text-decoration-none">
              <div className="card h-100 shadow-sm hover-shadow transition">
                <div className="card-body text-center p-4">
                  <div className={`mb-3 text-${section.color}`}>
                    <i className={`bi ${section.icon} fs-1`}></i>
                  </div>
                  <h5 className="card-title">{section.title}</h5>
                  <p className="card-text text-muted">{section.description}</p>
                </div>
                <div className={`card-footer bg-${section.color} bg-opacity-10 border-0`}>
                  <div className="text-center">
                    <span className={`text-${section.color} fw-semibold`}>
                      Gestisci <i className="bi bi-arrow-right"></i>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>


    </div>
  );
} 