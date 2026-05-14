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
      name: 'Free',
      price: '$0',
      period: 'forever',
      badge: '',
      features: [
        { text: '3 Resume Analyses / month', included: true },
        { text: '1 Job Match / month', included: true },
        { text: 'Basic ATS Score', included: true },
        { text: 'LinkedIn Profile Tips', included: false },
        { text: 'AI Resume Generator', included: false },
        { text: 'Professional Photos', included: false },
        { text: 'Cover Photo Generator', included: false },
        { text: 'Priority Processing', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: '/month',
      badge: 'MOST POPULAR',
      features: [
        { text: '30 Resume Analyses / month', included: true },
        { text: '15 Job Matches / month', included: true },
        { text: 'Detailed ATS Score + Section Breakdown', included: true },
        { text: 'LinkedIn Profile Tips', included: true },
        { text: '5 AI Resume Generations / month', included: true },
        { text: '3 Professional Photos / month', included: true },
        { text: '3 Cover Photos / month', included: true },
        { text: 'Priority Processing', included: true },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$29.99',
      period: '/month',
      badge: 'BEST VALUE',
      features: [
        { text: 'Unlimited Resume Analyses', included: true },
        { text: 'Unlimited Job Matches', included: true },
        { text: 'Detailed ATS + Industry Benchmarks', included: true },
        { text: 'LinkedIn Profile Tips', included: true },
        { text: 'Unlimited AI Resume Generations', included: true },
        { text: '20 Professional Photos / month', included: true },
        { text: '20 Cover Photos / month', included: true },
        { text: 'Priority Processing', included: true },
      ],
    },
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <span className="pricing-badge">💎 PRICING</span>
        <h1>Choose Your <span className="gradient-text">Career Plan</span></h1>
        <p>Unlock premium AI features to accelerate your career growth</p>
      </div>

      {error && <div className="pricing-error">{error}</div>}

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
                  {loading === plan.id ? 'Processing...' : `Upgrade to ${plan.name}`}
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
