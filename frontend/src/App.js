import React, { useState } from 'react';
import apiService, { APIError, NetworkError, TimeoutError } from './services/apiService';
import './App.css';

const SYMPTOMS = [
  { key: 'fever', icon: '🌡️', label: 'Fever' },
  { key: 'cough', icon: '🫁', label: 'Cough' },
  { key: 'headache', icon: '🤕', label: 'Headache' },
  { key: 'fatigue', icon: '😴', label: 'Fatigue' },
  { key: 'breathing', icon: '💨', label: 'Breathing Issues' }
];

function App() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const toggleSymptom = (symptomKey) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptomKey)) {
        return prev.filter(s => s !== symptomKey);
      } else {
        return [...prev, symptomKey];
      }
    });
    // Clear previous results when symptoms change
    setResult(null);
    setError(null);
  };

  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiService.checkSymptoms(selectedSymptoms);
      setResult(response);
    } catch (err) {
      console.error('Analysis failed:', err);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof NetworkError) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (err instanceof TimeoutError) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err instanceof APIError) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetAssessment = () => {
    setSelectedSymptoms([]);
    setResult(null);
    setError(null);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return '#dc2626';
      case 'medium': return '#ea580c';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getRiskBadgeClass = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'risk-badge-high';
      case 'medium': return 'risk-badge-medium';
      case 'low': return 'risk-badge-low';
      default: return 'risk-badge-default';
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">🏥</div>
          <div>
            <h1 className="app-title">HealthGuard</h1>
            <p className="app-subtitle">AI-powered health risk assessment</p>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Step 1: Symptom Selection */}
        <section className="card">
          <div className="card-header">
            <div className="step-indicator">
              <span className="step-number">1</span>
              <span className="step-title">Select Your Symptoms</span>
            </div>
            {selectedSymptoms.length > 0 && (
              <div className="symptom-count">
                {selectedSymptoms.length} selected
              </div>
            )}
          </div>

          <div className="symptom-grid">
            {SYMPTOMS.map(({ key, icon, label }) => {
              const isSelected = selectedSymptoms.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`symptom-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSymptom(key)}
                  disabled={loading}
                >
                  <div className="symptom-icon">{icon}</div>
                  <span className="symptom-label">{label}</span>
                  {isSelected && <div className="symptom-check">✓</div>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Analysis */}
        <section className="card">
          <div className="card-header">
            <div className="step-indicator">
              <span className="step-number">2</span>
              <span className="step-title">Risk Analysis</span>
            </div>
          </div>

          <div className="analysis-section">
            <button
              className="analyze-btn"
              onClick={analyzeSymptoms}
              disabled={loading || selectedSymptoms.length === 0}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-8.707-3-3a1 1 0 0 0-1.414 1.414L10.586 9H7a1 1 0 1 0 0 2h3.586l-1.293 1.293a1 1 0 1 0 1.414 1.414l3-3a1 1 0 0 0 0-1.414z" clipRule="evenodd"/>
                  </svg>
                  Analyze Risk
                </>
              )}
            </button>
            
            {selectedSymptoms.length === 0 && !loading && (
              <p className="analysis-hint">
                Select symptoms above to continue
              </p>
            )}
          </div>
        </section>

        {/* Error Display */}
        {error && (
          <section className="error-card">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
              <h3>Assessment Error</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={analyzeSymptoms} disabled={loading}>
                Try Again
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Results */}
        {result && (
          <section className="card result-card">
            <div className="card-header">
              <div className="step-indicator">
                <span className="step-number">3</span>
                <span className="step-title">Assessment Results</span>
              </div>
            </div>

            <div className="result-content">
              <div className="risk-display">
                <div className="risk-score" style={{ color: getRiskColor(result.riskLevel) }}>
                  <span className="score-number">{result.score}</span>
                  <span className="score-total">/100</span>
                </div>
                <div className={`risk-badge ${getRiskBadgeClass(result.riskLevel)}`}>
                  {result.riskLevel?.toUpperCase()} RISK
                </div>
              </div>

              <div className="symptoms-summary">
                <h4>Analyzed Symptoms</h4>
                <div className="symptom-tags">
                  {selectedSymptoms.map((symptomKey) => {
                    const symptom = SYMPTOMS.find(s => s.key === symptomKey);
                    return (
                      <span key={symptomKey} className="symptom-tag">
                        {symptom?.icon} {symptom?.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="recommendation">
                <h4>Medical Recommendation</h4>
                <p className="recommendation-text">{result.recommendation}</p>
              </div>

              <div className="result-meta">
                <p className="assessment-time">
                  Assessment completed at {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="result-actions">
                <button className="new-assessment-btn" onClick={resetAssessment}>
                  New Assessment
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>⚠️ This is not a medical diagnosis. Always consult with qualified healthcare professionals.</p>
      </footer>
    </div>
  );
}

export default App;
