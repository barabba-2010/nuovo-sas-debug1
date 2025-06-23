'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useAdmin } from '@/app/components/common/SessionProvider';

export default function TestDebugPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('file');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Redirect non-admin users
  React.useEffect(() => {
    // Wait for admin status to be determined
    if (isAdminLoading) {
      console.log('Admin status loading...');
      return;
    }

    if (!isAdmin) {
      console.log('User is not ADMIN, redirecting to /tests');
      router.push('/tests');
    }
  }, [isAdmin, isAdminLoading, router]);

  // Check API health on mount
  React.useEffect(() => {
    if (isAdmin && !isAdminLoading) {
      checkApiHealth();
    }
  }, [isAdmin, isAdminLoading]);

  const checkApiHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const response = await axios.get('/api/ai/generate-test/health');
      setHealthStatus(response.data);
    } catch (error) {
      console.error('Error checking API health:', error);
      toast.error('Impossibile verificare lo stato dell\'API');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // File type validation
      const validExtensions = ['.docx', '.pdf', '.xlsx', '.xls'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setErrorMessage('Please upload a supported file format (DOCX, PDF, XLSX).');
        return;
      }
      
      setUploadedFile(file);
      setErrorMessage('');
      
      // Create a preview if possible
      try {
        const reader = new FileReader();
        reader.onload = () => {
          // Just store the file name as preview
          setFilePreview(file.name);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  };

  const testFileProcessing = async () => {
    if (!uploadedFile) {
      setErrorMessage('Please upload a file to test.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setProcessingResult(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await axios.post('/api/ai/generate-test/test-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProcessingResult(response.data);
      toast.success('File processed successfully');
    } catch (error: any) {
      console.error('Error processing file:', error);
      
      let errorMsg = 'Error processing file';
      if (error.response?.data?.error) {
        errorMsg = `Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMsg = `Error: ${error.message}`;
      }
      
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderError = () => {
    if (!errorMessage) return null;
    
    return (
      <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
        <div className="d-flex">
          <div className="me-3">
            <i className="bi bi-exclamation-triangle-fill fs-3 text-danger"></i>
          </div>
          <div>
            <h5 className="alert-heading">Error</h5>
            <p className="mb-0">{errorMessage}</p>
          </div>
        </div>
        <button 
          type="button" 
          className="btn-close" 
          onClick={() => setErrorMessage('')}
        ></button>
      </div>
    );
  };

  const renderFileUpload = () => (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">Test File Processing</h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-3">
          Use this tool to test file processing functionality without consuming OpenAI credits.
        </p>
        
        <div className="mb-4">
          <div 
            className="border border-2 border-dashed rounded p-5 text-center cursor-pointer bg-light"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-primary');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary');
              
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0];
                
                // File type validation
                const validExtensions = ['.docx', '.pdf', '.xlsx', '.xls'];
                const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                
                if (!validExtensions.includes(fileExtension)) {
                  setErrorMessage('Please upload a supported file format (DOCX, PDF, XLSX).');
                  return;
                }
                
                setUploadedFile(file);
                setErrorMessage('');
                setFilePreview(file.name);
              }
            }}
            style={{cursor: 'pointer', transition: 'all 0.2s ease'}}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="d-none"
              accept=".docx,.pdf,.xlsx,.xls"
            />
            
            {uploadedFile ? (
              <div className="text-success">
                <i className={`bi bi-file-earmark${
                  uploadedFile.name.endsWith('.pdf') ? '-pdf text-danger' : 
                  uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls') ? '-spreadsheet text-success' : 
                  '-word text-primary'} display-4 mb-3`}></i>
                <h5 className="mb-1">{uploadedFile.name}</h5>
                <p className="text-muted mb-0">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                <div className="mt-3">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i> Change File
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <i className="bi bi-cloud-arrow-up display-4 mb-3 text-primary"></i>
                <h5 className="mb-2">Drop your document here</h5>
                <p className="text-muted mb-3">or click to browse files</p>
                <div className="d-flex justify-content-center gap-2 mb-2">
                  <div className="d-inline-block border rounded py-1 px-2 text-muted small">
                    <i className="bi bi-file-earmark-word me-1"></i> DOCX
                  </div>
                  <div className="d-inline-block border rounded py-1 px-2 text-muted small">
                    <i className="bi bi-file-earmark-pdf me-1"></i> PDF
                  </div>
                  <div className="d-inline-block border rounded py-1 px-2 text-muted small">
                    <i className="bi bi-file-earmark-spreadsheet me-1"></i> XLSX
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <button 
            className="btn btn-primary"
            onClick={testFileProcessing}
            disabled={isLoading || !uploadedFile}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : 'Test File Processing'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderProcessingResult = () => {
    if (!processingResult) return null;
    
    return (
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">Processing Result</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <h6>File Information:</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <tbody>
                  <tr>
                    <th style={{width: '30%'}}>Name</th>
                    <td>{processingResult.fileInfo.name}</td>
                  </tr>
                  <tr>
                    <th>Type</th>
                    <td>{processingResult.fileInfo.type}</td>
                  </tr>
                  <tr>
                    <th>Size</th>
                    <td>{(processingResult.fileInfo.size / 1024).toFixed(2)} KB</td>
                  </tr>
                  <tr>
                    <th>Processing Type</th>
                    <td>
                      <span className={`badge rounded-pill ${
                        processingResult.fileInfo.processingType === 'pdf' ? 'bg-danger' :
                        processingResult.fileInfo.processingType === 'docx' ? 'bg-primary' :
                        processingResult.fileInfo.processingType === 'excel' ? 'bg-success' :
                        'bg-secondary'
                      }`}>
                        {processingResult.fileInfo.processingType}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Extracted Content Length</th>
                    <td>{processingResult.contentLength} characters</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-3">
            <h6>Content Sample:</h6>
            <div className="border rounded p-3 bg-light">
              <pre className="mb-0" style={{whiteSpace: 'pre-wrap', fontSize: '0.9rem', maxHeight: '200px', overflow: 'auto'}}>
                {processingResult.contentSample}
              </pre>
            </div>
          </div>
          
          <div>
            <h6>Full Extracted Content:</h6>
            <div className="border rounded p-3 bg-light">
              <pre className="mb-0" style={{whiteSpace: 'pre-wrap', fontSize: '0.9rem', maxHeight: '400px', overflow: 'auto'}}>
                {processingResult.truncatedContent}
              </pre>
            </div>
            {processingResult.contentLength > processingResult.truncatedContent.length && (
              <div className="text-muted mt-2 small">
                <i className="bi bi-info-circle me-1"></i>
                Content truncated for display. Full length: {processingResult.contentLength} characters.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHealthStatus = () => {
    if (isCheckingHealth) {
      return (
        <div className="card shadow-sm">
          <div className="card-body text-center p-5">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <h5>Checking API Status...</h5>
          </div>
        </div>
      );
    }

    if (!healthStatus) {
      return (
        <div className="card shadow-sm">
          <div className="card-body text-center p-5">
            <div className="text-muted mb-3">
              <i className="bi bi-question-circle display-4"></i>
            </div>
            <h5>API Status Unknown</h5>
            <button className="btn btn-primary mt-3" onClick={checkApiHealth}>
              Check Status
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="card shadow-sm mb-4">
        <div className={`card-header ${healthStatus.status === 'ok' ? 'bg-success' : 'bg-danger'} text-white`}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">API Health Status</h5>
            <button className="btn btn-sm btn-light" onClick={checkApiHealth}>
              <i className="bi bi-arrow-repeat me-1"></i> Refresh
            </button>
          </div>
        </div>
        <div className="card-body">
          <p className="mb-3">
            <span className="badge bg-secondary me-2">Version:</span>
            {healthStatus.apiVersion}
          </p>
          
          <h6 className="border-bottom pb-2 mb-3">Module Status</h6>
          <div className="table-responsive mb-4">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Module</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>pdf-parse</td>
                  <td>
                    <span className={`badge ${healthStatus.modules.pdfParse === 'loaded' ? 'bg-success' : 'bg-danger'}`}>
                      {healthStatus.modules.pdfParse}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>mammoth (DOCX)</td>
                  <td>
                    <span className={`badge ${healthStatus.modules.mammoth === 'loaded' ? 'bg-success' : 'bg-danger'}`}>
                      {healthStatus.modules.mammoth}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>xlsx</td>
                  <td>
                    <span className={`badge ${healthStatus.modules.xlsx === 'loaded' ? 'bg-success' : 'bg-danger'}`}>
                      {healthStatus.modules.xlsx}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <h6 className="border-bottom pb-2 mb-3">Dependencies</h6>
          <div className="table-responsive mb-3">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Dependency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>OpenAI API</td>
                  <td>
                    <span className={`badge ${healthStatus.dependencies.openai === 'configured' ? 'bg-success' : 'bg-danger'}`}>
                      {healthStatus.dependencies.openai}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Database</td>
                  <td>
                    <span className={`badge ${healthStatus.dependencies.database === 'connected' ? 'bg-success' : 'bg-danger'}`}>
                      {healthStatus.dependencies.database}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <h6 className="border-bottom pb-2 mb-3">Supported Formats</h6>
          <div className="d-flex flex-wrap gap-2">
            {healthStatus.supportedFormats.map((format: string) => (
              <span key={format} className="badge bg-info">
                {format.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Test Generator Diagnostics</h2>
            <Link href="/tests/generator" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Generator
            </Link>
          </div>
          
          {renderError()}
          
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'file' ? 'active' : ''}`}
                onClick={() => setActiveTab('file')}
              >
                <i className="bi bi-file-earmark-text me-2"></i>
                File Processing
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
              >
                <i className="bi bi-heart-pulse me-2"></i>
                Health Check
              </button>
            </li>
          </ul>
          
          {activeTab === 'file' && (
            <>
              {renderFileUpload()}
              {renderProcessingResult()}
            </>
          )}
          
          {activeTab === 'health' && renderHealthStatus()}
        </div>
      </div>
    </div>
  );
} 