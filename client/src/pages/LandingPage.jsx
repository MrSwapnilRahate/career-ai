import { Link } from 'react-router-dom';
import heroBg from '../assets/hero-bg.png';
import aiIllustration from '../assets/ai-illustration.png';
import './LandingPage.css';

const features = [
  { icon: '🧠', title: 'AI Resume Analyzer', desc: 'Gemini 2.5 Pro evaluates your resume against 15+ ATS criteria with section-level scores.' },
  { icon: '🎯', title: 'Job Match Scoring', desc: 'Compare your resume against any job description to see your exact match percentage and gaps.' },
  { icon: '📝', title: 'Cover Letter Generator', desc: 'AI writes a tailored, compelling cover letter for any job in seconds — not generic templates.' },
  { icon: '🎤', title: 'AI Interview Coach', desc: '10 personalized interview questions with STAR-method model answers and coaching tips.' },
  { icon: '📊', title: 'Skills Gap Analyzer', desc: 'Discover missing skills, get a learning roadmap, career path, and certification recommendations.' },
  { icon: '💰', title: 'Salary Intelligence', desc: 'Market salary data, negotiation scripts, and compensation insights for your target role.' },
  { icon: '🔗', title: 'LinkedIn Optimizer', desc: 'Paste your LinkedIn profile for AI-driven improvement tips and keyword optimization.' },
  { icon: '📄', title: 'AI Resume Generator', desc: 'Generate ATS-optimized resumes from your LinkedIn profile in one click.' },
  { icon: '📸', title: 'Professional Photos', desc: 'Generate stunning AI headshots and cover photos for your LinkedIn profile.' },
];

const steps = [
  { num: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX file — it takes just 2 seconds.' },
  { num: '02', title: 'AI Analyzes', desc: 'Our AI engine extracts, scores, and evaluates every section.' },
  { num: '03', title: 'Get Results', desc: 'Receive detailed scores, skills, strengths, and improvement tips.' },
];

const stats = [
  { value: '50K+', label: 'Resumes Analyzed' },
  { value: '95%', label: 'User Satisfaction' },
  { value: '3s', label: 'Avg Processing' },
  { value: '85%', label: 'Interview Rate Increase' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ─── Hero Section ──────────────────────────────── */}
      <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay" />
        <div className="hero-content container">
          <div className="hero-text slide-up">
            <div className="hero-badge badge badge-purple">
              <span>✨</span> AI-Powered Resume Intelligence
            </div>
            <h1 className="hero-title">
              Accelerate Your Career with{' '}
              <span className="text-gradient">AI-Powered</span>{' '}
              Career Intelligence
            </h1>
            <p className="hero-subtitle">
              9 AI career tools in one platform — resume analysis, cover letters, interview prep, 
              salary insights, and more. Powered by Gemini 2.5 Pro. Starting at $19/mo.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Analyze Your Resume Free →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
          </div>
          <div className="hero-visual slide-up-delay">
            <img src={aiIllustration} alt="AI Resume Analysis" className="hero-illustration" />
            <div className="hero-glow" />
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─────────────────────────────────── */}
      <section className="stats-bar">
        <div className="container stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Section ──────────────────────────── */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">9 AI-Powered Tools</span>
            <h2 className="section-title">More Features Than Jobscan & Teal — <span className="text-gradient">At Half The Price</span></h2>
            <p className="section-desc">Everything you need for your entire job search — powered by Google Gemini 2.5 Pro, the world's most capable AI.</p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card glass-card">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────── */}
      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Three Simple Steps to a <span className="text-gradient">Better Resume</span></h2>
          </div>
          <div className="steps-grid">
            {steps.map((step) => (
              <div key={step.num} className="step-card">
                <div className="step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                <div className="step-line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-card">
            <h2>Why Pay $49/mo For Just Resume Scanning?</h2>
            <p>CareerAI gives you 9 AI-powered career tools for $19/mo — including features competitors don't even offer.</p>
            <div className="hero-actions" style={{ justifyContent: 'center' }}>
              <Link to="/signup" className="btn btn-primary btn-lg">
                Start Free — No Credit Card →
              </Link>
              <Link to="/pricing" className="btn btn-secondary btn-lg">
                Compare Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="brand-text">Career<span className="text-gradient">AI</span></span>
            <p>AI-powered career intelligence for modern professionals.</p>
          </div>
          <div className="footer-links">
            <Link to="/pricing">Pricing</Link>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
          <p className="footer-copy">© 2026 CareerAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
