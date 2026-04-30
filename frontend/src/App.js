import React, { useState } from 'react';
import apiService, { APIError, NetworkError, TimeoutError } from './services/apiService';
import './App.css';

const SYMPTOMS = [
  { key: 'fever',     icon: '🌡️', label: 'Fever' },
  { key: 'cough',     icon: '🫁', label: 'Cough' },
  { key: 'headache',  icon: '🤕', label: 'Headache' },
  { key: 'fatigue',   icon: '😴', label: 'Fatigue' },
  { key: 'breathing', icon: '💨', label: 'Breathing Issues' }
];

const FRIENDLY_SUMMARY = {
  low:    () => 'Rest at home · monitor symptoms',
  medium: () => 'Rest and monitor closely',
  high:   () => 'Seek medical help today',
};


const NEXT_STEPS = {
  low: [
    { icon: '💧', text: 'Drink plenty of water and rest at home' },
    { icon: '🌡️', text: 'Monitor your symptoms for the next 48 hours' },
    { icon: '📞', text: 'Call a clinic if symptoms get worse' },
  ],
  medium: [
    { icon: '🛏️', text: 'Rest and avoid physical activity today' },
    { icon: '💊', text: 'Take paracetamol if you have fever or pain' },
    { icon: '🏥', text: 'Visit a health center if no improvement in 24h' },
  ],
  high: [
    { icon: '🚨', text: 'Go to the nearest health center now' },
    { icon: '📵', text: 'Do not stay alone — ask someone to be with you' },
    { icon: '📋', text: 'Tell the doctor all symptoms you reported here' },
  ],
};

function App() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const toggleSymptom = (symptomKey) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptomKey)) {
        return prev.filter(s => s !== symptomKey);
      } else {
        return [...prev, symptomKey];
      }
    });
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
    setShowDetails(false);
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
    setShowDetails(false);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':   return '#dc2626';
      case 'medium': return '#F59E0B';
      case 'low':    return '#16a34a';
      default:       return '#6b7280';
    }
  };

  const SYMPTOM_MEANINGS = {
    fever: {
      label: 'Fever', icon: '🌡️',
      meaning: 'Your body temperature is elevated above normal range.',
      advice:  'Stay hydrated, rest, and monitor temperature every 4–6 hours. Seek care if fever exceeds 39°C (102°F) or persists beyond 3 days.',
    },
    cough: {
      label: 'Cough', icon: '🫁',
      meaning: 'Your airways are producing a reflexive clearing response.',
      advice:  'Avoid cold air and irritants. If cough is productive (with mucus) or worsening after 5 days, consult a clinician.',
    },
    headache: {
      label: 'Headache', icon: '🤕',
      meaning: 'You are experiencing pain or pressure in the head region.',
      advice:  'Rest in a quiet, dark room. Increase fluid intake. If headache is sudden, severe, or accompanied by neck stiffness, seek immediate care.',
    },
    fatigue: {
      label: 'Fatigue', icon: '😴',
      meaning: 'You are experiencing unusual tiredness or lack of energy.',
      advice:  'Prioritize sleep and avoid physical exertion. Fatigue lasting more than 7 days without improvement warrants medical evaluation.',
    },
    breathing: {
      label: 'Breathing Issues', icon: '💨',
      meaning: 'You are experiencing difficulty or discomfort when breathing.',
      advice:  'Do not ignore this symptom. Sit upright, avoid exertion, and seek medical attention promptly — especially if breathing worsens at rest.',
    },
  };

  const COMBINATION_INSIGHTS = [
    { match: ['fever', 'cough'],            insight: 'Fever + Cough is a classic viral respiratory pattern. This combination is commonly associated with influenza or COVID-19.' },
    { match: ['fever', 'breathing'],        insight: 'Fever + Breathing Issues is a high-priority combination. This may indicate pneumonia or lower respiratory infection — seek care today.' },
    { match: ['cough', 'breathing'],        insight: 'Cough + Breathing Issues suggests active lower airway involvement. This combination requires clinical assessment.' },
    { match: ['fever', 'fatigue'],          insight: 'Fever + Fatigue is a hallmark of systemic infection. Your body is under significant immune load — rest is essential.' },
    { match: ['headache', 'fatigue'],       insight: 'Headache + Fatigue together may indicate a viral illness or dehydration-driven inflammatory response.' },
    { match: ['fever', 'cough', 'fatigue'], insight: 'Fever + Cough + Fatigue is a textbook viral illness triad. Medical evaluation is strongly advised within 24–48 hours.' },
  ];


  const buildWhyExplanation = (symptoms) => {
    const perSymptom = symptoms.map(key => SYMPTOM_MEANINGS[key]).filter(Boolean);
    const combo = COMBINATION_INSIGHTS.find(c => c.match.every(k => symptoms.includes(k)));
    const countNote =
      symptoms.length >= 4 ? 'You reported 4 or more symptoms — this multi-system pattern significantly raises clinical concern and warrants prompt evaluation.' :
      symptoms.length >= 2 ? 'Multiple symptoms reported together increase the likelihood of an active condition rather than an isolated event.' :
      'A single symptom was reported — this is lower concern, but monitor for any new symptoms developing over the next 24–48 hours.';
    return { perSymptom, combo, countNote };
  };


  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">🏥</div>
          <div>
            <h1 className="app-title">HealthGuard</h1>
            <p className="app-subtitle">Your personal health check assistant</p>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Step 1: Symptom Selection */}
        <section className="card">
          <div className="card-header">
            <div className="step-indicator">
              <span className="step-number">1</span>
              <span className="step-title">How are you feeling today?</span>
            </div>
            {selectedSymptoms.length > 0 && (
              <div className="symptom-count">{selectedSymptoms.length} selected</div>
            )}
          </div>
          <p className="symptom-prompt">Tap everything that applies to you right now</p>
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
          <div className="symptom-action">
            <button
              className="analyze-btn"
              onClick={analyzeSymptoms}
              disabled={loading || selectedSymptoms.length === 0}
            >
              {loading ? (
                <><div className="spinner"></div>Checking...</>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-8.707-3-3a1 1 0 0 0-1.414 1.414L10.586 9H7a1 1 0 1 0 0 2h3.586l-1.293 1.293a1 1 0 1 0 1.414 1.414l3-3a1 1 0 0 0 0-1.414z" clipRule="evenodd"/>
                  </svg>
                  Check My Health
                </>
              )}
            </button>
            {selectedSymptoms.length === 0 && !loading && (
              <p className="analysis-hint">Select your symptoms above first</p>
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
              <button className="retry-btn" onClick={analyzeSymptoms} disabled={loading}>Try Again</button>
            </div>
          </section>
        )}

        {/* Step 3: Results */}
        {result && (() => {
          const level = result.riskLevel?.toLowerCase();
          const riskColor = getRiskColor(result.riskLevel);
          const summary = FRIENDLY_SUMMARY[level]?.(selectedSymptoms);
          const nextSteps = NEXT_STEPS[level] || NEXT_STEPS.low;
          const { perSymptom, combo, countNote } = buildWhyExplanation(selectedSymptoms);
          const detectedSymptoms = selectedSymptoms.map(k => SYMPTOMS.find(s => s.key === k)).filter(Boolean);
          const riskEmoji = level === 'high' ? '🔴' : level === 'medium' ? '🟡' : '🟢';
          return (
            <section className="card result-card">
              <div className="result-header" style={{ background: riskColor }}>
                <div className="result-header-left">
                  <span className="result-header-emoji">{riskEmoji}</span>
                  <div>
                    <div className="result-header-level">{result.riskLevel?.charAt(0).toUpperCase() + result.riskLevel?.slice(1).toLowerCase()} Risk</div>
                    <div className="result-header-summary">{summary}</div>
                  </div>
                </div>
                <div className="result-header-score">
                  <span className="result-score-num">{result.score}</span>
                  <span className="result-score-den">/100</span>
                </div>
              </div>

              <div className="result-content">

                {/* SCORE BAR */}
                <div className="clarity-track">
                  <div className="clarity-fill" style={{ width: `${result.score}%`, background: riskColor }}></div>
                </div>
                <div className="clarity-zones">
                  <span className={`zone-label ${level === 'low' ? 'zone-active' : 'zone-dim'}`}>Low</span>
                  <span className={`zone-label ${level === 'medium' ? 'zone-active' : 'zone-dim'}`}>Medium</span>
                  <span className={`zone-label ${level === 'high' ? 'zone-active' : 'zone-dim'}`}>High</span>
                </div>

                {/* SYMPTOMS */}
                <div className="symptoms-summary">
                  <h4>Symptoms you reported</h4>
                  <div className="symptom-tags">
                    {detectedSymptoms.map(s => (
                      <span key={s.key} className="symptom-tag">{s.icon} {s.label}</span>
                    ))}
                  </div>
                </div>

                {/* WHAT TO DO NOW */}
                <div className="next-steps-section">
                  <h4>What to do now</h4>
                  <ul className="next-steps-list">
                    {nextSteps.map((step, i) => (
                      <li key={i} className="next-step-item">
                        <span className="next-step-icon">{step.icon}</span>
                        <span className="next-step-text">{step.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* COLLAPSIBLE DETAILS */}
                <button className="details-toggle" onClick={() => setShowDetails(v => !v)}>
                  {showDetails ? '▲ Hide details' : '▼ Why this result?'}
                </button>

                {showDetails && (
                  <div className="why-explanation">
                    <div className="why-symptom-list">
                      {perSymptom.map((s, i) => (
                        <div key={i} className="why-symptom-block">
                          <div className="why-symptom-header">
                            <span className="why-symptom-icon">{s.icon}</span>
                            <span className="why-symptom-name">{s.label}</span>
                          </div>
                          <div className="why-symptom-rows">
                            <div className="why-row">
                              <span className="why-row-label">Meaning</span>
                              <span className="why-row-value">{s.meaning}</span>
                            </div>
                            <div className="why-row why-row-advice">
                              <span className="why-row-label">Advice</span>
                              <span className="why-row-value">{s.advice}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {combo && (
                      <div className="why-combo">
                        <span className="why-symptom-name">Note</span> — {combo.insight.split('.')[0]}.
                      </div>
                    )}
                    <p className="why-count">{countNote}</p>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="next-actions">
                  <button className="action-btn action-btn-primary action-btn-full" onClick={() => window.open('https://www.google.com/maps/search/health+center+near+me', '_blank')}>
                    📍 Find Nearest Clinic
                  </button>
                  <button className="action-btn action-btn-secondary action-btn-full" onClick={() => window.open('https://wa.me/?text=I+need+health+assistance', '_blank')}>
                    💬 Talk to Assistant
                  </button>
                </div>

                {/* TERTIARY: NEW CHECK */}
                <button className="btn-tertiary" onClick={resetAssessment}>Start New Check</button>
                <p className="single-disclaimer">
                  🔒 Private &amp; secure · Not a medical diagnosis · Consult a health professional
                </p>

              </div>
            </section>
          );
        })()}
      </main>

      <footer className="app-footer">
        <p>HealthGuard · Rwanda Health Tech · v1.0</p>
      </footer>
    </div>
  );
}

export default App;
