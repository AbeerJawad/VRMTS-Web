import React from "react";
import { Link } from "react-router-dom";
import { Brain, Zap, CheckCircle2, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-sans selection:bg-emerald-500/30">
      <div className="relative z-10 flex-grow flex flex-col">
        {/* --- NAVBAR --- */}
        <header className="flex justify-between items-center px-6 md:px-12 py-5 bg-neutral-950 border-b border-neutral-900 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-white">VR</span>
              <span className="text-emerald-500">MTS</span>
            </h1>
          </div>
          <nav className="hidden md:flex gap-8 text-sm items-center font-medium">
            <a href="#features" className="text-neutral-500 hover:text-white transition-colors">
              Features
            </a>
            <a href="#modules" className="text-neutral-500 hover:text-white transition-colors">
              Modules
            </a>
            <a href="#team" className="text-neutral-500 hover:text-white transition-colors">
              Team
            </a>
            <div className="w-px h-4 bg-neutral-800 mx-2" />
            <Link to="/login" className="text-neutral-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="bg-white text-neutral-950 px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors"
            >
              Quick Access
            </Link>
          </nav>
        </header>

        {/* --- HERO SECTION --- */}
        <section className="relative px-6 md:px-12 py-24 md:py-32 flex-grow max-w-7xl mx-auto w-full flex flex-col items-center text-center justify-center border-x border-neutral-900/50">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTAgMGgyNHYyNEgwWiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)] z-[-1]" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            V1.0 is now live for students
          </div>

          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl">
            Anatomy education,<br />
            <span className="text-neutral-500">reimagined for reality.</span>
          </h2>

          <p className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-2xl mb-10">
            A comprehensive WebGL and VR training platform for medical students. 
            Master anatomical structures and surgical procedures with interactive, scalable, and tracked modules.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/dashboard"
              className="bg-emerald-600 text-white px-6 py-3 rounded-md font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Access Platform
              <ArrowRight className="w-4 h-4 pb-0.5" />
            </Link>
            <Link
              to="/login"
              className="bg-neutral-900 border border-neutral-800 text-white px-6 py-3 rounded-md font-medium hover:bg-neutral-800 transition-colors w-full sm:w-auto text-center"
            >
              Instructor Login
            </Link>
          </div>
          
          <div className="mt-16 pt-8 border-t border-neutral-900 w-full max-w-3xl flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-neutral-500">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> WebGL Native</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> VR Headset Ready</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Progression Tracking</span>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section id="features" className="border-t border-neutral-900 bg-neutral-950">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 border-x border-neutral-900/50">
            <div className="mb-16">
              <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Core Curriculum</h3>
              <p className="text-neutral-400 max-w-2xl text-lg">
                Designed to integrate seamlessly into existing medical programs.
              </p>
            </div>

            {/* Bento-style grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4">
              <div className="md:col-span-2 md:row-span-2 p-8 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col">
                <Brain className="w-8 h-8 text-neutral-400 mb-6" />
                <h4 className="text-xl font-bold text-white mb-3">Immersive 3D Environments</h4>
                <p className="text-neutral-400 leading-relaxed max-w-md flex-grow">
                  Navigate complex anatomical structures intuitively. Our rendering engine pushes web technology to its limits, allowing high fidelity examination directly in the browser or instantly inside a headset.
                </p>
                <div className="mt-8 relative w-full border border-neutral-800 rounded-md overflow-hidden bg-neutral-950">
                  <img src="/forland.png" alt="Interactive Viewport Preview" className="w-full h-auto object-cover opacity-90" />
                </div>
              </div>
              
              <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-lg">
                <Zap className="w-6 h-6 text-neutral-400 mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">Automated Grading</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Real-time progression tracking and instant quiz evaluations mapped to curriculum standard competencies.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* --- TEAM SECTION --- */}
        <section id="team" className="border-t border-neutral-900 bg-neutral-950">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 border-x border-neutral-900/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Engineering</h3>
                <p className="text-neutral-400 max-w-xl text-lg">
                  Built by a dedicated team focused on educational simulation.
                </p>
              </div>
              <a href="mailto:contact@vrmts.app" className="font-medium text-white hover:text-emerald-500 transition-colors flex items-center gap-2">
                Connect with us <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-12 gap-x-8">
              <TeamMember name="Tauha Imran" role="Unity & VR Architecture" />
              <TeamMember name="Abeer Jawad" role="Backend & WebGL Systems" />
              <TeamMember name="Daniya Qasim" role="Machine Learning Analyst" />
            </div>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-neutral-900 bg-neutral-950 text-neutral-500 text-sm py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-neutral-300">VRMTS</span>
              <span>© {new Date().getFullYear()} All rights reserved.</span>
            </div>
            
            <div className="flex gap-8 font-medium">
              <a href="#features" className="hover:text-white transition-colors">Platform</a>
              <Link to="/dashboard" className="hover:text-white transition-colors">Demo</Link>
              <Link to="/login" className="hover:text-white transition-colors">Instructor Access</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ---- COMPONENTS ---- */

interface TeamMemberProps {
  name: string;
  role: string;
}

function TeamMember({ name, role }: TeamMemberProps) {
  return (
    <div className="flex flex-col">
      <div className="w-16 h-16 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-600 flex items-center justify-center font-bold text-xl mb-4">
        {name[0]}
      </div>
      <h5 className="font-bold text-white mb-1">
        {name}
      </h5>
      <p className="text-neutral-500 text-sm">
        {role}
      </p>
    </div>
  );
}
