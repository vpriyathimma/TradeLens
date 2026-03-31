import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { Menu, X, Sun, Moon } from 'lucide-react';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import StockAnalysis from "./pages/StockAnalysis";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './ThemeContext';
import ChatWidget from './components/ChatWidget';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Navbar */}
      <nav
        className="p-4 w-full sticky top-0 z-50 transition-all duration-300"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #C08090 0%, #D4A0B0 100%)'
            : 'linear-gradient(135deg, #E8A0B0 0%, #F0C4CF 100%)',
          boxShadow: '0 4px 20px rgba(232, 160, 176, 0.25)'
        }}
      >
        <div className="container mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="text-xl font-bold">
            <Link
              to="/"
              className="text-white hover:opacity-80 transition-opacity flex items-center gap-2"
              onClick={closeMobileMenu}
            >
              <span className="text-xl font-bold">TradeLens</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center space-x-4">
            {/* Theme Toggle */}
            <li>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 text-white"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </li>

            {!isLoggedIn && (
              <>
                <li>
                  <Link
                    to="/login"
                    className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-all duration-300"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="px-5 py-2 rounded-xl bg-white text-pink-600 font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </li>
              </>
            )}
            {isLoggedIn && (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-all duration-300"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 rounded-xl bg-white text-purple-600 font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div
              className="absolute top-full left-0 w-full lg:hidden animate-fade-in"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #C08090 0%, #D4A0B0 100%)'
                  : 'linear-gradient(135deg, #E8A0B0 0%, #F0C4CF 100%)'
              }}
            >
              <ul className="flex flex-col items-center space-y-4 p-6">
                {/* Theme Toggle Mobile */}
                <li>
                  <button
                    onClick={toggleTheme}
                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 text-white"
                    aria-label="Toggle theme"
                  >
                    {isDark ? <Sun size={24} /> : <Moon size={24} />}
                  </button>
                </li>

                {!isLoggedIn && (
                  <>
                    <li>
                      <Link
                        to="/login"
                        className="block px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-all"
                        onClick={closeMobileMenu}
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/signup"
                        className="block px-6 py-3 rounded-xl bg-white text-pink-600 font-medium transition-all"
                        onClick={closeMobileMenu}
                      >
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
                {isLoggedIn && (
                  <>
                    <li>
                      <Link
                        to="/dashboard"
                        className="block px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-all"
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }}
                        className="block px-6 py-3 rounded-xl bg-white text-purple-600 font-medium transition-all"
                      >
                        Logout
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={<Login onLogin={() => setIsLoggedIn(true)} />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stocks" element={<StockAnalysis />} />
          <Route path="/stocks/:symbol" element={<StockAnalysis />} />
        </Routes>

        {/* Floating Action Button */}
        <button
          onClick={() => window.open("https://llm-rag1.streamlit.app/", "_blank")}
          className="fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #E8A0B0 0%, #F0C4CF 100%)',
            boxShadow: '0 4px 20px rgba(232, 160, 176, 0.35)'
          }}
          title="Chat with us"
        >
          <span className="text-2xl">💬</span>
        </button>
      </main>

      {/* Footer */}
      <footer
        className="p-6 text-center transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-muted)'
        }}
      >
        <div className="container mx-auto">
          <p className="text-sm">© 2026 TradeLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            success: { duration: 3000 },
            error: { duration: 5000 },
            style: {
              borderRadius: '12px',
              padding: '16px',
            }
          }}
        />
        <AppContent />
        <ChatWidget />
      </Router>
    </ThemeProvider>
  );
}

export default App;