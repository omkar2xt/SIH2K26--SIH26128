import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Leaf, ClipboardList, FlaskConical, Settings, Check } from 'lucide-react';
import { BRAND } from '../../utils/branding';

const i18n = {
  en: {
    tagline: "LIVESTOCK HEALTH INTELLIGENCE",
    mainMessage: "From livestock observation to informed veterinary action.",
    subMessage: "A livestock health decision-support platform connecting farmers, veterinarians, laboratory workflows and official health monitoring.",
    healthResponseCycle: "HEALTH RESPONSE CYCLE",
    observeTitle: "01. OBSERVE",
    observeDesc: "Record symptoms & observations",
    detectTitle: "02. DETECT",
    detectDesc: "Identify abnormal health patterns",
    assessTitle: "03. ASSESS",
    assessDesc: "Explainable potential-risk assessment",
    actTitle: "04. ACT",
    actDesc: "Veterinary investigation & follow-up",
    feat1: "Individual Health Fingerprint",
    feat2: "Explainable Risk Assessment",
    feat3: "Event Snapshots",
    feat4: "GIS & Potential Cluster Monitoring",
    sih: "Smart India Hackathon 2026",
    ps: "Problem Statement: SIH26128",
    gov: "Government of Maharashtra",
    signInTitle: "SIGN IN",
    signInDesc: "Access your PASHU-RAKSHA workspace.",
    usernameLabel: "USERNAME / EMAIL",
    usernamePlaceholder: "Enter your username or email",
    passwordLabel: "PASSWORD",
    forgotPassword: "Forgot password?",
    passwordPlaceholder: "Enter your password",
    signInBtn: "SIGN IN",
    secureAccess: "✓ Secure role-based access",
    demoAccess: "DEMO ACCESS",
    demoDesc: "Explore the platform using demonstration workspaces.",
    farmerTitle: "Farmer / Herd Owner",
    farmerDesc: "Monitor livestock and report health observations.",
    farmerBtn: "Open Farmer Demo",
    vetTitle: "Veterinarian",
    vetDesc: "Review alerts, health evidence and investigate animal cases.",
    vetBtn: "Open Vet Demo",
    labTitle: "Diagnostic Laboratory",
    labDesc: "Manage samples, tests and laboratory results.",
    labBtn: "Open Lab Demo",
    adminTitle: "Administrator",
    adminDesc: "Manage users, roles and system configuration.",
    adminBtn: "Open Admin Demo",
    footerText: "PASHU-RAKSHA • SIH 2026 • SIH26128",
    privacy: "Privacy",
    userManual: "User Manual",
    help: "Help"
  },
  mr: {
    tagline: "पशुधन आरोग्य बुद्धिमत्ता",
    mainMessage: "पशुधनाच्या निरीक्षणापासून माहितीपूर्ण पशुवैद्यकीय कृतीपर्यंत.",
    subMessage: "शेतकरी, पशुवैद्यक, प्रयोगशाळा प्रक्रिया आणि अधिकृत आरोग्य निरीक्षण यांना जोडणारे पशुधन आरोग्य निर्णय-सहाय्य व्यासपीठ.",
    healthResponseCycle: "आरोग्य प्रतिसाद प्रक्रिया",
    observeTitle: "01. निरीक्षण करा",
    observeDesc: "लक्षणे व निरीक्षणे नोंदवा",
    detectTitle: "02. शोधा",
    detectDesc: "असामान्य आरोग्य नमुने ओळखा",
    assessTitle: "03. मूल्यांकन करा",
    assessDesc: "स्पष्टीकरणासह संभाव्य जोखीम मूल्यांकन",
    actTitle: "04. कृती करा",
    actDesc: "पशुवैद्यकीय तपासणी व पुढील कार्यवाही",
    feat1: "वैयक्तिक आरोग्य फिंगरप्रिंट",
    feat2: "स्पष्टीकरणासह जोखीम मूल्यांकन",
    feat3: "आरोग्य घटना स्नॅपशॉट",
    feat4: "GIS व संभाव्य क्लस्टर निरीक्षण",
    sih: "स्मार्ट इंडिया हॅकाथॉन २०२६",
    ps: "समस्या विधान: SIH26128",
    gov: "महाराष्ट्र शासन",
    signInTitle: "साइन इन",
    signInDesc: "आपल्या PASHU-RAKSHA कार्यक्षेत्रात प्रवेश करा.",
    usernameLabel: "वापरकर्तानाव / ईमेल",
    usernamePlaceholder: "आपले वापरकर्तानाव किंवा ईमेल प्रविष्ट करा",
    passwordLabel: "पासवर्ड",
    forgotPassword: "पासवर्ड विसरलात?",
    passwordPlaceholder: "आपला पासवर्ड प्रविष्ट करा",
    signInBtn: "साइन इन",
    secureAccess: "✓ सुरक्षित भूमिका-आधारित प्रवेश",
    demoAccess: "डेमो प्रवेश",
    demoDesc: "प्रात्यक्षिक कार्यक्षेत्र वापरून व्यासपीठाचा अनुभव घ्या.",
    farmerTitle: "शेतकरी / पशुपालक",
    farmerDesc: "पशुधनाच्या आरोग्यावर लक्ष ठेवा आणि आरोग्यविषयक निरीक्षणे नोंदवा.",
    farmerBtn: "शेतकरी डेमो उघडा",
    vetTitle: "पशुवैद्यक",
    vetDesc: "सूचना व आरोग्यविषयक पुराव्यांचे पुनरावलोकन करा आणि प्राण्यांच्या प्रकरणांची तपासणी करा.",
    vetBtn: "पशुवैद्यकीय डेमो उघडा",
    labTitle: "निदान प्रयोगशाळा",
    labDesc: "नमुने, चाचण्या आणि प्रयोगशाळेतील निकाल व्यवस्थापित करा.",
    labBtn: "प्रयोगशाळा डेमो उघडा",
    adminTitle: "प्रशासक",
    adminDesc: "वापरकर्ते, भूमिका आणि प्रणाली संरचना व्यवस्थापित करा.",
    adminBtn: "प्रशासक डेमो उघडा",
    footerText: "PASHU-RAKSHA • SIH 2026 • SIH26128",
    privacy: "गोपनीयता",
    userManual: "वापरकर्ता मार्गदर्शक",
    help: "मदत"
  },
  hi: {
    tagline: "पशुधन स्वास्थ्य बुद्धिमत्ता",
    mainMessage: "पशुधन के निरीक्षण से सूचित पशु-चिकित्सकीय कार्रवाई तक।",
    subMessage: "किसानों, पशु चिकित्सकों, प्रयोगशाला प्रक्रियाओं और आधिकारिक स्वास्थ्य निगरानी को जोड़ने वाला पशुधन स्वास्थ्य निर्णय-सहायता मंच।",
    healthResponseCycle: "स्वास्थ्य प्रतिक्रिया प्रक्रिया",
    observeTitle: "01. निरीक्षण करें",
    observeDesc: "लक्षण और निरीक्षण दर्ज करें",
    detectTitle: "02. पहचानें",
    detectDesc: "असामान्य स्वास्थ्य पैटर्न की पहचान करें",
    assessTitle: "03. मूल्यांकन करें",
    assessDesc: "स्पष्टीकरण योग्य संभावित जोखिम मूल्यांकन",
    actTitle: "04. कार्रवाई करें",
    actDesc: "पशु-चिकित्सकीय जांच और आगे की कार्रवाई",
    feat1: "व्यक्तिगत स्वास्थ्य फिंगरप्रिंट",
    feat2: "स्पष्टीकरण योग्य जोखिम मूल्यांकन",
    feat3: "स्वास्थ्य घटना स्नैपशॉट",
    feat4: "GIS और संभावित क्लस्टर निगरानी",
    sih: "स्मार्ट इंडिया हैकाथॉन २०२६",
    ps: "समस्या विवरण: SIH26128",
    gov: "महाराष्ट्र शासन",
    signInTitle: "साइन इन",
    signInDesc: "अपने PASHU-RAKSHA कार्यक्षेत्र में प्रवेश करें।",
    usernameLabel: "उपयोगकर्ता नाम / ईमेल",
    usernamePlaceholder: "अपना उपयोगकर्ता नाम या ईमेल दर्ज करें",
    passwordLabel: "पासवर्ड",
    forgotPassword: "पासवर्ड भूल गए?",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    signInBtn: "साइन इन",
    secureAccess: "✓ सुरक्षित भूमिका-आधारित प्रवेश",
    demoAccess: "डेमो प्रवेश",
    demoDesc: "प्रदर्शन कार्यक्षेत्रों का उपयोग करके मंच का अनुभव करें।",
    farmerTitle: "किसान / पशुपालक",
    farmerDesc: "पशुधन के स्वास्थ्य की निगरानी करें और स्वास्थ्य संबंधी निरीक्षण दर्ज करें।",
    farmerBtn: "किसान डेमो खोलें",
    vetTitle: "पशु चिकित्सक",
    vetDesc: "अलर्ट और स्वास्थ्य संबंधी साक्ष्यों की समीक्षा करें तथा पशुओं के मामलों की जांच करें।",
    vetBtn: "पशु चिकित्सक डेमो खोलें",
    labTitle: "नैदानिक प्रयोगशाला",
    labDesc: "नमूनों, परीक्षणों और प्रयोगशाला परिणामों का प्रबंधन करें।",
    labBtn: "प्रयोगशाला डेमो खोलें",
    adminTitle: "प्रशासक",
    adminDesc: "उपयोगकर्ताओं, भूमिकाओं और सिस्टम कॉन्फ़िगरेशन का प्रबंधन करें।",
    adminBtn: "प्रशासक डेमो खोलें",
    footerText: "PASHU-RAKSHA • SIH 2026 • SIH26128",
    privacy: "गोपनीयता",
    userManual: "उपयोगकर्ता मार्गदर्शिका",
    help: "सहायता"
  }
};

export default function Landing({ onSelectRole }) {
  const [lang, setLang] = useState('en');
  const t = i18n[lang];

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter your username and password');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await onSelectRole({ username: username.trim(), password });
      if (res && !res.success) {
        setError(res.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to connect to backend server. Is it running on port 3000?');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (roleKey) => {
    setLoading(true);
    setError('');
    try {
      const res = await onSelectRole({ demoRole: roleKey.toLowerCase() });
      if (res && !res.success) {
        setError(res.error || `Unable to login as ${roleKey}.`);
      }
    } catch (err) {
      setError(err?.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 text-slate-800 font-sans overflow-x-hidden">
      
      {/* LEFT PANEL: 45% on desktop, rich gradient & spacious layout */}
      <section className="w-full md:w-[45%] lg:w-[44%] xl:w-[44%] bg-gradient-to-br from-[#072d21] via-[#0d4733] to-[#052218] text-white p-6 sm:p-10 lg:p-14 xl:p-16 border-b md:border-b-0 md:border-r border-[#126f4b]/50 md:h-screen md:overflow-y-auto shrink-0 flex flex-col relative shadow-xl">
        <div className="max-w-[680px] mx-auto w-full flex flex-col h-full relative z-10">
          
          {/* Top Branding Block */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center shadow-lg text-emerald-300 shrink-0 backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div>
                <span className="block text-2xl lg:text-[26px] font-black tracking-tight text-white leading-tight font-display">PASHU-RAKSHA</span>
                <span className="block text-xs font-bold tracking-widest text-emerald-300 uppercase mt-0.5">{t.tagline}</span>
              </div>
            </div>
          </div>
          
          {/* Main Statement & Description */}
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.2] font-display max-w-xl drop-shadow-sm">
              {t.mainMessage}
            </h1>
            <p className="text-emerald-100/90 text-base lg:text-lg font-normal leading-relaxed mt-4 max-w-xl">
              {t.subMessage}
            </p>
          </div>
          
          {/* Health Response Cycle */}
          <div className="mb-10 lg:mb-12">
            <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-emerald-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {t.healthResponseCycle}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
              <div className="bg-white/[0.08] hover:bg-white/[0.12] border border-emerald-400/25 rounded-xl p-4 flex flex-col justify-center min-h-[85px] backdrop-blur-md transition-all shadow-sm">
                <span className="text-xs sm:text-sm font-black tracking-wide text-emerald-300">{t.observeTitle}</span>
                <span className="text-sm sm:text-[15px] text-emerald-50 mt-1 leading-snug font-medium">{t.observeDesc}</span>
              </div>
              <div className="bg-white/[0.08] hover:bg-white/[0.12] border border-emerald-400/25 rounded-xl p-4 flex flex-col justify-center min-h-[85px] backdrop-blur-md transition-all shadow-sm">
                <span className="text-xs sm:text-sm font-black tracking-wide text-emerald-300">{t.detectTitle}</span>
                <span className="text-sm sm:text-[15px] text-emerald-50 mt-1 leading-snug font-medium">{t.detectDesc}</span>
              </div>
              <div className="bg-white/[0.08] hover:bg-white/[0.12] border border-emerald-400/25 rounded-xl p-4 flex flex-col justify-center min-h-[85px] backdrop-blur-md transition-all shadow-sm">
                <span className="text-xs sm:text-sm font-black tracking-wide text-emerald-300">{t.assessTitle}</span>
                <span className="text-sm sm:text-[15px] text-emerald-50 mt-1 leading-snug font-medium">{t.assessDesc}</span>
              </div>
              <div className="bg-white/[0.08] hover:bg-white/[0.12] border border-emerald-400/25 rounded-xl p-4 flex flex-col justify-center min-h-[85px] backdrop-blur-md transition-all shadow-sm">
                <span className="text-xs sm:text-sm font-black tracking-wide text-emerald-300">{t.actTitle}</span>
                <span className="text-sm sm:text-[15px] text-emerald-50 mt-1 leading-snug font-medium">{t.actDesc}</span>
              </div>
            </div>
          </div>
          
          {/* Key Capabilities */}
          <div className="space-y-3.5 text-sm sm:text-base text-emerald-100 font-medium mb-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Check size={16} className="text-emerald-300" strokeWidth={3} />
              </div>
              <span>{t.feat1}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Check size={16} className="text-emerald-300" strokeWidth={3} />
              </div>
              <span>{t.feat2}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Check size={16} className="text-emerald-300" strokeWidth={3} />
              </div>
              <span>{t.feat3}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Check size={16} className="text-emerald-300" strokeWidth={3} />
              </div>
              <span>{t.feat4}</span>
            </div>
          </div>
          
          {/* Footer */}
          <footer className="mt-auto pt-6 border-t border-emerald-800/60 space-y-1.5 text-xs sm:text-sm">
            <p className="font-semibold text-white/95">{t.sih}</p>
            <p className="text-emerald-200/90">{t.ps}</p>
            <p className="text-emerald-300/80">{t.gov}</p>
          </footer>
        </div>
      </section>
      
      {/* RIGHT PANEL: 55-56% on desktop, clean, spacious & prominent */}
      <section className="w-full md:w-[55%] lg:w-[56%] xl:w-[56%] bg-white flex flex-col md:h-screen md:overflow-y-auto">
        
        {/* Language Selector Top Right */}
        <div className="flex items-center justify-end p-5 md:p-8 shrink-0 bg-slate-50 md:bg-white border-b border-slate-200 md:border-transparent">
          <div className="inline-flex items-center text-sm font-semibold text-slate-600 bg-slate-100/80 rounded-xl p-1.5 border border-slate-200 shadow-sm">
            <button 
              onClick={() => setLang('en')}
              className={`px-3.5 py-1.5 rounded-lg transition min-w-[70px] ${lang === 'en' ? 'bg-white text-[#0d4733] font-bold shadow-sm' : 'hover:text-slate-900'}`} 
              type="button"
            >
              English
            </button>
            <button 
              onClick={() => setLang('mr')}
              className={`px-3.5 py-1.5 rounded-lg transition min-w-[70px] ${lang === 'mr' ? 'bg-white text-[#0d4733] font-bold shadow-sm' : 'hover:text-slate-900'}`} 
              type="button"
            >
              मराठी
            </button>
            <button 
              onClick={() => setLang('hi')}
              className={`px-3.5 py-1.5 rounded-lg transition min-w-[70px] ${lang === 'hi' ? 'bg-white text-[#0d4733] font-bold shadow-sm' : 'hover:text-slate-900'}`} 
              type="button"
            >
              हिंदी
            </button>
          </div>
        </div>
        
        {/* Center Login Container: comfortably widened from 450px to 560px */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-8 md:py-10 w-full max-w-[560px] xl:max-w-[590px] mx-auto">
          
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-slate-900 font-display">{t.signInTitle}</h2>
            <p className="text-base sm:text-lg text-slate-600 mt-2 font-normal">{t.signInDesc}</p>
          </div>
          
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 sm:p-4.5 text-sm sm:text-base text-red-700 border border-red-200 font-medium flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign-In Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                {t.usernameLabel}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  required
                  className="block w-full px-4.5 py-4 text-base sm:text-[17px] bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d4733] focus:border-transparent focus:bg-white transition" 
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                  {t.passwordLabel}
                </label>
                <button type="button" className="text-xs sm:text-sm font-semibold text-[#0d4733] hover:text-emerald-900 hover:underline">
                  {t.forgotPassword}
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder} 
                  required
                  className="block w-full pl-4.5 pr-12 py-4 text-base sm:text-[17px] bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d4733] focus:border-transparent focus:bg-white transition" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility" 
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center hover:text-slate-600 focus:outline-none ${showPassword ? 'text-[#0d4733]' : 'text-slate-400'}`}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>
            
            <button 
              id="login-submit-btn"
              type="submit" 
              disabled={loading}
              className="w-full mt-3 bg-[#0d4733] hover:bg-[#093929] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-70 text-base sm:text-lg min-h-[56px]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{t.signInBtn}</span>
                  <span aria-hidden="true" className="text-xl">→</span>
                </>
              )}
            </button>
            
            <div className="text-center pt-1">
              <span className="text-xs sm:text-sm text-slate-500 font-medium">{t.secureAccess}</span>
            </div>
          </form>
          
          <div className="my-8 md:my-10 border-t border-slate-200 w-full"></div>
          
          {/* DEMO ACCESS SECTION */}
          <div>
            <div className="mb-5">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">{t.demoAccess}</h3>
              <p className="text-sm sm:text-base text-slate-600 mt-1">{t.demoDesc}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Farmer */}
              <button 
                type="button" 
                onClick={() => handleDemoLogin('Farmer')} 
                className="text-left w-full border border-slate-200 hover:border-emerald-600 rounded-xl p-5 transition-all bg-white hover:bg-emerald-50/30 group flex flex-col min-h-[140px] shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
                    <Leaf size={20} />
                  </div>
                  <h4 className="text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-[#0d4733] transition">{t.farmerTitle}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-auto">{t.farmerDesc}</p>
                <div className="mt-3.5 text-sm sm:text-base font-bold text-[#0d4733] group-hover:text-emerald-900 group-hover:translate-x-1.5 transition-all flex items-center gap-1.5">
                  <span>{t.farmerBtn}</span>
                  <span>→</span>
                </div>
              </button>
              
              {/* Vet */}
              <button 
                type="button" 
                onClick={() => handleDemoLogin('Vet')} 
                className="text-left w-full border border-slate-200 hover:border-emerald-600 rounded-xl p-5 transition-all bg-white hover:bg-emerald-50/30 group flex flex-col min-h-[140px] shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                    <ClipboardList size={20} />
                  </div>
                  <h4 className="text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-[#0d4733] transition">{t.vetTitle}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-auto">{t.vetDesc}</p>
                <div className="mt-3.5 text-sm sm:text-base font-bold text-[#0d4733] group-hover:text-emerald-900 group-hover:translate-x-1.5 transition-all flex items-center gap-1.5">
                  <span>{t.vetBtn}</span>
                  <span>→</span>
                </div>
              </button>
              
              {/* Lab */}
              <button 
                type="button" 
                onClick={() => handleDemoLogin('Lab')} 
                className="text-left w-full border border-slate-200 hover:border-emerald-600 rounded-xl p-5 transition-all bg-white hover:bg-emerald-50/30 group flex flex-col min-h-[140px] shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform">
                    <FlaskConical size={20} />
                  </div>
                  <h4 className="text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-[#0d4733] transition">{t.labTitle}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-auto">{t.labDesc}</p>
                <div className="mt-3.5 text-sm sm:text-base font-bold text-[#0d4733] group-hover:text-emerald-900 group-hover:translate-x-1.5 transition-all flex items-center gap-1.5">
                  <span>{t.labBtn}</span>
                  <span>→</span>
                </div>
              </button>
              
              {/* Admin */}
              <button 
                type="button" 
                onClick={() => handleDemoLogin('Admin')} 
                className="text-left w-full border border-slate-200 hover:border-emerald-600 rounded-xl p-5 transition-all bg-white hover:bg-emerald-50/30 group flex flex-col min-h-[140px] shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700 shrink-0 group-hover:scale-105 transition-transform">
                    <Settings size={20} />
                  </div>
                  <h4 className="text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-[#0d4733] transition">{t.adminTitle}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-auto">{t.adminDesc}</p>
                <div className="mt-3.5 text-sm sm:text-base font-bold text-[#0d4733] group-hover:text-emerald-900 group-hover:translate-x-1.5 transition-all flex items-center gap-1.5">
                  <span>{t.adminBtn}</span>
                  <span>→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Bottom Footer */}
        <div className="p-6 md:p-8 border-t border-slate-200 flex flex-col lg:flex-row items-center lg:justify-between gap-3.5 text-xs sm:text-sm text-slate-500 shrink-0 mx-0 lg:mx-8 mb-2 mt-auto text-center lg:text-left">
          <div className="order-2 lg:order-1">
            <span>{t.footerText}</span>
          </div>
          <div className="order-1 lg:order-2 flex flex-wrap justify-center items-center gap-x-5 gap-y-2">
            <button type="button" className="hover:text-slate-800 transition p-1">{t.privacy}</button>
            <span className="text-slate-300 hidden lg:inline">•</span>
            <button type="button" className="hover:text-slate-800 transition p-1">{t.userManual}</button>
            <span className="text-slate-300 hidden lg:inline">•</span>
            <button type="button" className="hover:text-slate-800 transition p-1">{t.help}</button>
          </div>
        </div>
        
      </section>
    </main>
  );
}
