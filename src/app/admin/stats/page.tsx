'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
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

  if (session?.user?.role !== 'ADMIN') {
    router.push('/');
    return null;
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/admin">Admin</Link></li>
          <li className="breadcrumb-item active">Statistiche</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Statistiche e Analytics</h1>
          <p className="text-muted">Dashboard con statistiche avanzate</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-graph-up fs-1 text-muted mb-3 d-block"></i>
          <h4>Funzionalità in arrivo</h4>
          <p className="text-muted">
            Le statistiche avanzate e gli analytics saranno disponibili prossimamente.
          </p>
          <p className="text-muted">
            Potrai visualizzare:
          </p>
          <ul className="list-unstyled text-muted">
            <li>• Statistiche per organizzazione</li>
            <li>• Analisi dei risultati dei test</li>
            <li>• Trend e metriche di utilizzo</li>
            <li>• Report aggregati per team</li>
          </ul>
          <Link href="/admin" className="btn btn-primary mt-3">
            <i className="bi bi-arrow-left me-2"></i>
            Torna al Pannello Admin
          </Link>
        </div>
      </div>
    </div>
  );
} 