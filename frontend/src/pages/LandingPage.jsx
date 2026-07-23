import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full p-6 flex justify-between items-center backdrop-blur-md bg-white/70 dark:bg-slate-900/70 fixed top-0 z-50 shadow-sm">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">CampusBite AI</div>
        <div className="space-x-4">
          <Link to="/login" className="text-slate-600 hover:text-blue-600 dark:text-slate-300 font-medium">Log In</Link>
          <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center text-center px-4 pt-32 pb-20 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6">
          The Smart Way to Order <br className="hidden md:block"/> Food on Campus
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-10">
          Skip the lines, pre-book your meals, and get AI-powered recommendations. Order from the web, WhatsApp, or Telegram instantly.
        </p>
        <div className="flex gap-4">
          <Link to="/register" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition transform">
            Join Now
          </Link>
          <Link to="/login" className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold shadow-lg border border-slate-200 hover:bg-slate-50 transition">
            Vendor Portal
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-500 border-t border-slate-200 dark:border-slate-800">
        <p>&copy; {new Date().getFullYear()} CampusBite AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
