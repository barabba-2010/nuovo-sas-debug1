'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ManagerAnalyticsPage() {
  const { data: session } = useSession();

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/manager">Dashboard Manager</Link>
          </li>
          <li className="breadcrumb-item active">Analitiche</li>
        </ol>
      </nav>

      <div className="row mb-4">
        <div className="col">
          <h1 className="h2">Analitiche del Team</h1>
          <p className="text-muted">
            Analisi dettagliate delle performance e dei risultati del tuo team
          </p>
        </div>
      </div>

      {/* Placeholder per contenuto futuro */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="bi bi-graph-up-arrow fs-1 text-muted mb-3 d-block"></i>
              <h3 className="text-muted">Sezione in Sviluppo</h3>
              <p className="text-muted">
                Le analitiche dettagliate del team saranno disponibili a breve.
              </p>
              <p className="text-muted">
                Qui potrai visualizzare:
              </p>
              <ul className="list-unstyled text-muted">
                <li>📊 Grafici delle performance del team</li>
                <li>📈 Trend dei test completati nel tempo</li>
                <li>📉 Analisi comparative dei risultati</li>
                <li>🎯 Metriche di engagement del team</li>
                <li>📋 Report aggregati e statistiche avanzate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/manager" className="btn btn-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Torna alla Dashboard
        </Link>
      </div>
    </div>
  );
} 