import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../api/client';
import './PricingPage.css';

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const currentPlan = user?.subscription?.plan || 'free';

  const handleCheckout = async (plan) => {
    setLoading(plan);
    setError('');
    try {
      const res = await subscriptionAPI.createCheckout(plan);
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    try {
      const res = await subscriptionAPI.createPortal();
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.message);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      price: '$0',
      period: 'forever',
      badge: '',
      tagline: 'Perfect for trying out CareerAI',
      features: [
        { text: '3 Resume Analyses / month', included: true },
        { text: '1 Job Match / month', included: true },
        { text: 'Basic ATS Score', included: true },
        { text: 'Resume Format Tips', included: true },
        { text: 'Cover Letter Generator', included: false },
        { text: 'AI Interview Prep', included: false },
        { text: 'Skills Gap Analyzer', included: false },
        { text: 'Salary Insights', included: false },
        { text: 'LinkedIn Optimizer', included: false },
        { text: 'AI Resume Generator', included: false },
        { text: 'Professional AI Photos', included: false },
        { text: 'Priority Processing (Gemini 2.5 Pro)', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: '/month',
      badge: 'MOST POPULAR',
      tagline: 'For active job seekers — 60% cheaper than Jobscan',
      features: [
        { text: '50 Resume Analyses / month', included: true },
        { text: '25 Job Matches / month', included: true },
        { text: 'Detailed ATS Score + Section Breakdown', included: true },
        { text: '10 Cover Letters / month', included: true },
        { text: '5 AI Interview Preps / month', included: true },
        { text: '3 Skills Gap Analyses / month', included: true },
        { text: '3 Salary Insights / month', included: true },
        { text: 'LinkedIn Profile Optimizer', included: true },
        { text: '10 AI Resume Generations / month', included: true },
        { text: '5 Professional AI Photos / month', included: true },
        { text: 'Gemini 2.5 Pro AI Model', included: true },
        { text: 'Priority Processing', included: true },
      ],
    },
    {
      id: 'career_pro',
      name: 'Career Pro',
      price: '$39',
      period: '/month',
      badge: 'BEST VALUE',
      tagline: 'All-in-one career toolkit — unlimited everything',
      features: [
        { text: 'Unlimited Resume Analyses', included: true },
        { text: 'Unlimited Job Matches', included: true },
        { text: 'Advanced ATS + Industry Benchmarks', included: true },
        { text: 'Unlimited Cover Letters', included: true },
        { text: 'Unlimited AI Interview Preps', included: true },
        { text: 'Unlimited Skills Gap Analyses', included: true },
        { text: 'Unlimited Salary Insights', included: true },
        { text: 'LinkedIn Profile Optimizer', included: true },
        { text: 'Unlimited AI Resume Generations', included: true },
        { text: '30 Professional AI Photos / month', included: true },
        { text: 'Gemini 2.5 Pro AI Model', included: true },
        { text: 'Priority Processing', included: true },
      ],
    },
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <span className="pricing-badge">💎 PRICING</span>
        <h1>Choose Your <span className="gradient-text">Career Plan</span></h1>
        <p>More features than Jobscan, Resume Worded & Teal — at a fraction of the price</p>
      </div>

      {error && <div className="pricing-error">{error}</div>}

      <div className="pricing-compare">
        <p className="compare-text">💡 <strong>Why CareerAI?</strong> Competitors charge $49/mo for just resume scanning. We give you ATS analysis, LinkedIn optimization, AI photos, and resume generation — starting at <strong>$19/mo</strong>.</p>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${plan.id === 'pro' ? 'featured' : ''} ${currentPlan === plan.id ? 'current' : ''}`}
          >
            {plan.badge && <span className="plan-badge">{plan.badge}</span>}

            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="price">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              {plan.tagline && <p className="plan-tagline">{plan.tagline}</p>}
            </div>

            <ul className="plan-features">
              {plan.features.map((feature, i) => (
                <li key={i} className={feature.included ? 'included' : 'excluded'}>
                  <span className="feature-icon">{feature.included ? '✓' : '✕'}</span>
                  {feature.text}
                </li>
              ))}
            </ul>

            <div className="plan-action">
              {currentPlan === plan.id ? (
                <button className="btn-current" onClick={plan.id !== 'free' ? handlePortal : undefined}>
                  {plan.id === 'free' ? 'Current Plan' : 'Manage Subscription'}
                </button>
              ) : plan.id === 'free' ? (
                <button className="btn-free" disabled>Free Forever</button>
              ) : (
                <button
                  className={`btn-upgrade ${plan.id === 'pro' ? 'btn-pro' : 'btn-enterprise'}`}
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? 'Processing...' : `Get ${plan.name}`}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Can I cancel anytime?</h4>
            <p>Yes, cancel anytime from your dashboard. You'll keep access until the end of your billing period.</p>
          </div>
          <div className="faq-item">
            <h4>What AI model powers the analysis?</h4>
            <p>We use Google Gemini 2.5 Pro — one of the most advanced AI models available for deep resume analysis.</p>
          </div>
          <div className="faq-item">
            <h4>Do unused credits roll over?</h4>
            <p>No, monthly limits reset at the beginning of each billing cycle.</p>
          </div>
          <div className="faq-item">
            <h4>Is my data secure?</h4>
            <p>Yes, all data is encrypted in transit and at rest. We never share your resume data with third parties.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
