'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function TestResultsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const params = useParams();
  const testId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  
  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        
        // Get the test info
        const testResponse = await axios.get(`/api/tests/${testId}`);
        setTest(testResponse.data);
        
        // Get the most recent test result for this user and test
        const resultsResponse = await axios.get(`/api/tests/${testId}/results`);
        if (resultsResponse.data && resultsResponse.data.length > 0) {
          setTestResult(resultsResponse.data[0]);
          
          // Try to fetch the associated report
          if (resultsResponse.data[0].id) {
            try {
              const reportResponse = await axios.get(`/api/reports?testResultId=${resultsResponse.data[0].id}`);
              if (reportResponse.data && reportResponse.data.length > 0) {
                setReport(reportResponse.data[0]);
              }
            } catch (reportErr) {
              console.error('Error fetching report:', reportErr);
            }
          }
        }
        
      } catch (err) {
        console.error('Error fetching test results:', err);
        setError('Unable to fetch test results. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    if (testId && status === 'authenticated') {
      fetchResults();
    }
  }, [testId, status]);
  
  if (status === 'loading' || loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading test results...</p>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">Login Required</h4>
          <p>You need to log in to view your test results.</p>
          <hr />
          <Link href="/auth/login" className="btn btn-primary">
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Login
          </Link>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <hr />
          <Link href="/tests" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/tests" className="btn btn-outline-secondary mb-2">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Tests
          </Link>
          <h1 className="h2 mb-0">Test Completed: {test?.title}</h1>
        </div>
      </div>
      
      {/* Success Message */}
      <div className="alert alert-success mb-4">
        <div className="d-flex">
          <div className="me-3">
            <i className="bi bi-check-circle-fill fs-1"></i>
          </div>
          <div>
            <h4 className="alert-heading">Test Completed Successfully!</h4>
            <p className="mb-0">Your answers have been saved and will be reviewed by our team. Thank you for completing the test.</p>
          </div>
        </div>
      </div>
      
      {/* Report Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h4 className="card-title mb-4">Test Summary</h4>
          
          <div className="row">
            <div className="col-md-6">
              <div className="mb-4">
                <h5 className="text-muted mb-3">Test Information</h5>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted">Title</span>
                  <span className="fw-medium">{test?.title}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted">Category</span>
                  <span className="fw-medium">{test?.category}</span>
                </div>
                <div className="d-flex justify-content-between py-2">
                  <span className="text-muted">Date Completed</span>
                  <span className="fw-medium">
                    {testResult?.completedAt 
                      ? new Date(testResult.completedAt).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="mb-4">
                <h5 className="text-muted mb-3">What's Next?</h5>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex align-items-center border-0 px-0 py-2">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center me-3" style={{width: '28px', height: '28px'}}>
                      <i className="bi bi-clock"></i>
                    </div>
                    Your test results are being processed
                  </li>
                  <li className="list-group-item d-flex align-items-center border-0 px-0 py-2">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center me-3" style={{width: '28px', height: '28px'}}>
                      <i className="bi bi-envelope"></i>
                    </div>
                    You'll receive an email when your results are ready
                  </li>
                  <li className="list-group-item d-flex align-items-center border-0 px-0 py-2">
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center me-3" style={{width: '28px', height: '28px'}}>
                      <i className="bi bi-file-earmark-text"></i>
                    </div>
                    You can access your results report here when ready
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Preview if available */}
      {report && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h4 className="card-title mb-4">
              <i className="bi bi-file-earmark-text me-2"></i>
              {report.title}
            </h4>
            
            <div className="card bg-light border-0">
              <div className="card-body">
                <div dangerouslySetInnerHTML={{ __html: report.content }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 