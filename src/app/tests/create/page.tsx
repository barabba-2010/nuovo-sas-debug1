'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Definisco le interfacce per TypeScript
interface TestOption {
  value: string;
  label: string;
}

interface TestQuestion {
  id: string;
  text: string;
  type: 'SCALE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TEXT';
  options: TestOption[];
}

interface TestData {
  title: string;
  category: string;
  description: string;
  instructions: string;
  questions: TestQuestion[];
}

export default function CreateTestPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for the test form
  const [testData, setTestData] = useState<TestData>({
    title: '',
    category: '',
    description: '',
    instructions: '',
    questions: []
  });
  
  // Check for admin access
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    if (session.user?.role !== 'ADMIN') {
      router.push('/tests');
      return;
    }
    
    // Add a default question
    addNewQuestion();
    
    setLoading(false);
  }, [session, status, router]);
  
  // Generate default options based on question type
  const getDefaultOptions = (type: TestQuestion['type']): TestOption[] => {
    switch (type) {
      case 'SCALE':
        return [
          { value: '1', label: 'Strongly Disagree' },
          { value: '2', label: 'Disagree' },
          { value: '3', label: 'Neutral' },
          { value: '4', label: 'Agree' },
          { value: '5', label: 'Strongly Agree' }
        ];
      case 'MULTIPLE_CHOICE':
        return [
          { value: 'A', label: 'Option A' },
          { value: 'B', label: 'Option B' },
          { value: 'C', label: 'Option C' },
          { value: 'D', label: 'Option D' }
        ];
      case 'TRUE_FALSE':
        return [
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' }
        ];
      case 'TEXT':
        return [];
      default:
        return [];
    }
  };
  
  // Add a new question
  const addNewQuestion = () => {
    const newQuestion: TestQuestion = {
      id: `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      type: 'SCALE',
      options: getDefaultOptions('SCALE')
    };
    
    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };
  
  // Remove a question
  const removeQuestion = (questionId: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };
  
  // Update question text
  const updateQuestionText = (questionId: string, text: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, text } : q
      )
    }));
  };
  
  // Update question type
  const updateQuestionType = (questionId: string, type: TestQuestion['type']) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, type, options: getDefaultOptions(type) } : q
      )
    }));
  };
  
  // Update option
  const updateOption = (questionId: string, optionIndex: number, value: string, field: 'value' | 'label') => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const updatedOptions = [...q.options];
          updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            [field]: value
          };
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    }));
  };
  
  // Add a new option to a question
  const addOption = (questionId: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const newOption: TestOption = {
            value: `option${q.options.length + 1}`,
            label: `Option ${q.options.length + 1}`
          };
          return { ...q, options: [...q.options, newOption] };
        }
        return q;
      })
    }));
  };
  
  // Remove an option from a question
  const removeOption = (questionId: string, optionIndex: number) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options.length > 2) {
          const updatedOptions = [...q.options];
          updatedOptions.splice(optionIndex, 1);
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    
    // Validazione di base
    if (!testData.title.trim()) {
      setErrorMessage('Please enter a test title');
      return;
    }
    
    if (!testData.category) {
      setErrorMessage('Please select a category');
      return;
    }
    
    if (!testData.description.trim()) {
      setErrorMessage('Please enter a test description');
      return;
    }
    
    if (!testData.instructions.trim()) {
      setErrorMessage('Please enter test instructions');
      return;
    }
    
    if (testData.questions.length === 0) {
      setErrorMessage('Please add at least one question');
      return;
    }
    
    // Validazione delle domande
    for (const q of testData.questions) {
      if (!q.text.trim()) {
        setErrorMessage('All questions must have text');
        return;
      }
      
      if (q.type === 'MULTIPLE_CHOICE' && q.options.length < 2) {
        setErrorMessage('Multiple choice questions must have at least 2 options');
        return;
      }
    }
    
    setSaveLoading(true);
    
    try {
      // Create the test data object to send to the API
      const testToSave = {
        ...testData,
        isActive: !saveAsDraft
      };
      
      // Make the API call to save the test
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testToSave),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create test');
      }
      
      const result = await response.json();
      
      setSaveLoading(false);
      setSuccessMessage(`Test ${saveAsDraft ? 'saved as draft' : 'created'} successfully!`);
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/tests/manage');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving test:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the test. Please try again.');
      setSaveLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading test creator...</p>
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Create New Test</h1>
        <Link href="/tests/manage" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>Back to Test Management
        </Link>
      </div>
      
      {/* Error Message */}
      {errorMessage && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
          <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
        </div>
      )}
      
      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}
      
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Test Details</h5>
        </div>
        <div className="card-body">
          <form onSubmit={(e) => handleSubmit(e, false)}>
            {/* Test Basic Information */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">General Information</h6>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="testTitle" className="form-label">Test Title <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="testTitle" 
                    placeholder="Enter test title" 
                    value={testData.title}
                    onChange={(e) => setTestData({...testData, title: e.target.value})}
                    required 
                  />
                </div>
                
                <div className="col-md-6">
                  <label htmlFor="testCategory" className="form-label">Category <span className="text-danger">*</span></label>
                  <select 
                    className="form-select" 
                    id="testCategory" 
                    value={testData.category}
                    onChange={(e) => setTestData({...testData, category: e.target.value})}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="PERSONALITY">Personality</option>
                    <option value="COGNITIVE">Cognitive</option>
                    <option value="ANXIETY">Anxiety</option>
                    <option value="DEPRESSION">Depression</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>
                
                <div className="col-12">
                  <label htmlFor="testDescription" className="form-label">Description <span className="text-danger">*</span></label>
                  <textarea 
                    className="form-control" 
                    id="testDescription" 
                    rows={3} 
                    placeholder="Enter a detailed description of the test"
                    value={testData.description}
                    onChange={(e) => setTestData({...testData, description: e.target.value})}
                    required
                  ></textarea>
                </div>
                
                <div className="col-12">
                  <label htmlFor="testInstructions" className="form-label">Instructions for Test Takers <span className="text-danger">*</span></label>
                  <textarea 
                    className="form-control" 
                    id="testInstructions" 
                    rows={3} 
                    placeholder="Enter clear instructions for people taking this test"
                    value={testData.instructions}
                    onChange={(e) => setTestData({...testData, instructions: e.target.value})}
                    required
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Questions Section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Questions</h6>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addNewQuestion}>
                  <i className="bi bi-plus-circle me-2"></i>Add Question
                </button>
              </div>
              
              {/* Question cards */}
              {testData.questions.map((question, index) => (
                <div className="card mb-3 border" key={question.id}>
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Question {index + 1}</h6>
                    <div>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeQuestion(question.id)}
                        disabled={testData.questions.length <= 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Question Text <span className="text-danger">*</span></label>
                      <textarea 
                        className="form-control" 
                        rows={2} 
                        placeholder="Enter your question" 
                        value={question.text}
                        onChange={(e) => updateQuestionText(question.id, e.target.value)}
                        required
                      ></textarea>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Question Type <span className="text-danger">*</span></label>
                      <select 
                        className="form-select"
                        value={question.type}
                        onChange={(e) => updateQuestionType(question.id, e.target.value as TestQuestion['type'])}
                      >
                        <option value="SCALE">Scale (1-5)</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                        <option value="TRUE_FALSE">True/False</option>
                        <option value="TEXT">Text Answer</option>
                      </select>
                    </div>
                    
                    {question.type !== 'TEXT' && (
                      <div className="mb-0">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label mb-0">Options</label>
                          {question.type === 'MULTIPLE_CHOICE' && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => addOption(question.id)}
                            >
                              <i className="bi bi-plus-circle"></i> Add Option
                            </button>
                          )}
                        </div>
                        <div className="option-items">
                          {question.options.map((option, optIndex) => (
                            <div className="input-group mb-2" key={`${question.id}-option-${optIndex}`}>
                              <span className="input-group-text">{option.value}</span>
                              <input 
                                type="text" 
                                className="form-control" 
                                value={option.label} 
                                onChange={(e) => updateOption(question.id, optIndex, e.target.value, 'label')}
                                readOnly={question.type !== 'MULTIPLE_CHOICE'}
                              />
                              {question.type === 'MULTIPLE_CHOICE' && question.options.length > 2 && (
                                <button 
                                  className="btn btn-outline-danger" 
                                  type="button"
                                  onClick={() => removeOption(question.id, optIndex)}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Placeholder for no questions */}
              {testData.questions.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded bg-light">
                  <p className="mb-0">Click "Add Question" to add questions to your test</p>
                </div>
              )}
            </div>
            
            {/* Submit Buttons */}
            <div className="d-flex justify-content-between">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => router.push('/tests/manage')}
              >
                Cancel
              </button>
              <div>
                <button 
                  type="button" 
                  className="btn btn-outline-primary me-2"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save as Draft'
                  )}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>Create Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 