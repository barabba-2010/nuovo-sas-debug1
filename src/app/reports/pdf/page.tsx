import React from 'react';
import Link from 'next/link';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function PDFReportsPage() {
  // Mock report data
  const availableReports = [
    {
      id: 'r1',
      testName: 'Personality Assessment',
      completedDate: '2023-10-15',
      reportGenerated: true,
      aiAnalysis: true,
      combinedProfile: false
    },
    {
      id: 'r2',
      testName: 'Anxiety Screening',
      completedDate: '2023-09-28',
      reportGenerated: true,
      aiAnalysis: true,
      combinedProfile: false
    },
    {
      id: 'r3',
      testName: 'Depression Inventory',
      completedDate: '2023-09-15',
      reportGenerated: false,
      aiAnalysis: false,
      combinedProfile: false
    },
    {
      id: 'r4',
      testName: 'Cognitive Abilities Test',
      completedDate: '2023-08-22',
      reportGenerated: true,
      aiAnalysis: false,
      combinedProfile: false
    }
  ];

  return (
    <main className="d-flex flex-column min-vh-100">
      <Navbar />
      
      <div className="flex-grow-1 bg-light">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0">PDF Reports</h1>
            <div>
              <Link href="/reports/generate-combined" className="btn btn-success me-2">
                <i className="bi bi-file-earmark-bar-graph me-2"></i>Generate Combined Profile
              </Link>
              <Link href="/reports" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>Back to Reports
              </Link>
            </div>
          </div>
          
          {/* Info Card */}
          <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-info-circle-fill me-2 fs-4"></i>
            <div>
              Our AI-powered PDF reports include detailed analysis, personalized insights, and professional visualizations of your test results. 
              Generate individual test reports or create a comprehensive profile combining multiple assessments.
            </div>
          </div>
          
          {/* Reports Table */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">Available Reports</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th scope="col">Test Name</th>
                      <th scope="col">Completed Date</th>
                      <th scope="col">Status</th>
                      <th scope="col">AI Analysis</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableReports.map(report => (
                      <tr key={report.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-3">
                              <i className="bi bi-file-earmark-text text-primary fs-4"></i>
                            </div>
                            <div>
                              <p className="fw-bold mb-0">{report.testName}</p>
                              <p className="text-muted mb-0 small">Report ID: {report.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>{report.completedDate}</td>
                        <td>
                          {report.reportGenerated ? (
                            <span className="badge bg-success">Generated</span>
                          ) : (
                            <span className="badge bg-warning text-dark">Pending</span>
                          )}
                        </td>
                        <td>
                          {report.aiAnalysis ? (
                            <span className="badge bg-info">
                              <i className="bi bi-robot me-1"></i>Complete
                            </span>
                          ) : (
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-magic me-1"></i>Generate
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            {report.reportGenerated ? (
                              <Link href={`/reports/pdf/${report.id}`} className="btn btn-sm btn-primary">
                                <i className="bi bi-eye me-1"></i>View
                              </Link>
                            ) : (
                              <button className="btn btn-sm btn-success">
                                <i className="bi bi-file-earmark-pdf me-1"></i>Generate
                              </button>
                            )}
                            <button className="btn btn-sm btn-outline-secondary">
                              <i className="bi bi-download me-1"></i>Download
                            </button>
                            <button className="btn btn-sm btn-outline-danger">
                              <i className="bi bi-trash me-1"></i>Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Report Generation Features */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0">Advanced Report Features</h5>
            </div>
            <div className="card-body">
              <div className="row row-cols-1 row-cols-md-3 g-4">
                <div className="col">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="p-2 rounded bg-primary bg-opacity-10 me-3">
                          <i className="bi bi-robot text-primary fs-4"></i>
                        </div>
                        <h5 className="card-title mb-0">AI-Powered Analysis</h5>
                      </div>
                      <p className="card-text">Our advanced AI analyzes test results to provide personalized insights and recommendations based on psychological research.</p>
                      <button className="btn btn-sm btn-outline-primary mt-2">Learn More</button>
                    </div>
                  </div>
                </div>
                
                <div className="col">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="p-2 rounded bg-success bg-opacity-10 me-3">
                          <i className="bi bi-graph-up-arrow text-success fs-4"></i>
                        </div>
                        <h5 className="card-title mb-0">Interactive Charts</h5>
                      </div>
                      <p className="card-text">Visualize test data with interactive charts and graphs that help you understand patterns and trends in your assessments.</p>
                      <button className="btn btn-sm btn-outline-success mt-2">View Examples</button>
                    </div>
                  </div>
                </div>
                
                <div className="col">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div className="p-2 rounded bg-info bg-opacity-10 me-3">
                          <i className="bi bi-people text-info fs-4"></i>
                        </div>
                        <h5 className="card-title mb-0">Comparative Analysis</h5>
                      </div>
                      <p className="card-text">Compare your results with normative data and benchmark against relevant demographic groups for deeper insights.</p>
                      <button className="btn btn-sm btn-outline-info mt-2">Learn More</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Combined Profile Section */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Comprehensive Profile Report</h5>
              <span className="badge bg-warning text-dark">Premium Feature</span>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <p>The Comprehensive Profile Report combines multiple test results into a unified analysis, providing a holistic view of your psychological profile.</p>
                  <div className="mt-3">
                    <h6 className="fw-bold">This report includes:</h6>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item border-0 ps-0 py-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Personality traits overview</li>
                      <li className="list-group-item border-0 ps-0 py-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Cognitive abilities assessment</li>
                      <li className="list-group-item border-0 ps-0 py-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Emotional well-being indicators</li>
                      <li className="list-group-item border-0 ps-0 py-1"><i className="bi bi-check-circle-fill text-success me-2"></i>Comparative analysis with normative data</li>
                      <li className="list-group-item border-0 ps-0 py-1"><i className="bi bi-check-circle-fill text-success me-2"></i>AI-generated recommendations</li>
                    </ul>
                  </div>
                </div>
                <div className="col-md-4 d-flex align-items-center justify-content-center">
                  <Link href="/reports/generate-combined" className="btn btn-lg btn-success w-100">
                    <i className="bi bi-file-earmark-bar-graph me-2"></i>Generate Combined Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
} 