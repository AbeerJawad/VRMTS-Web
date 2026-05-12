import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Monitor, Headset } from "lucide-react";
import { useEffect } from "react";
import { buildApiUrl } from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [platform, setPlatform] = useState<"Web" | "VR-Ready" | "VR-Native">("Web");

  useEffect(() => {
    const checkPlatform = async () => {
      // Check for standalone VR browsers (Quest, Oculus, Pico)
      const ua = navigator.userAgent;
      const isVRNative = /Quest|OculusBrowser|PicoBrowser|ViveBrowser/i.test(ua);
      
      if (isVRNative) {
        setPlatform("VR-Native");
        return;
      }

      // Check for WebXR support (Desktop browsers with VR hardware)
      if ((navigator as any).xr) {
        try {
          const supported = await (navigator as any).xr.isSessionSupported('immersive-vr');
          if (supported) {
            setPlatform("VR-Ready");
          }
        } catch (e) {
          console.warn("WebXR check failed:", e);
        }
      }
    };
    checkPlatform();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Success!');
        setTimeout(() => {
          let dashboardPath = '/studentdashboard';
          if (data.user.userType === 'teacher' || data.user.userType === 'instructor') {
            dashboardPath = '/instructordashboard';
          } else if (data.user.userType === 'admin') {
            dashboardPath = '/admindashboard';
          }
          navigate(dashboardPath);
        }, 1000);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection failed. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "bg-neutral-950 border-neutral-800 text-neutral-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors duration-200 rounded-md";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-white">VR</span>
            <span className="text-emerald-500">MTS</span>
          </h1>
          <span className="text-neutral-500 text-sm hover:text-white transition-colors">← Back to home</span>
        </Link>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 relative overflow-hidden">
          {/* Platform Badge */}
          <div className="absolute top-0 right-0 p-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm ${
              platform === 'VR-Native' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                : platform === 'VR-Ready'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-neutral-800/50 border-neutral-700/50 text-neutral-500'
            }`}>
              {platform === 'VR-Native' || platform === 'VR-Ready' ? (
                <Headset className="w-3 h-3" />
              ) : (
                <Monitor className="w-3 h-3" />
              )}
              {platform === 'VR-Native' ? 'Native VR Session' : platform === 'VR-Ready' ? 'VR Immersive Ready' : 'Standard Web'}
            </div>
          </div>

          {error && (
            <Alert className="mb-4 bg-red-500/10 border-red-500/50 text-red-500 rounded-md">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-emerald-500/10 border-emerald-500/50 text-emerald-500 rounded-md">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-neutral-300 font-medium text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={inputStyle}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-neutral-300 font-medium text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className={inputStyle}
              />
            </div>

            <div className="flex justify-between items-center pb-2">
              <div />
              <button type="button" className="text-sm text-neutral-400 hover:text-white transition-colors" disabled={loading}>
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-medium rounded-md transition-colors h-10"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 text-neutral-500 bg-neutral-900">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-neutral-800 bg-transparent hover:bg-neutral-800 text-neutral-200 transition-colors rounded-md h-10"
            disabled={loading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          By continuing, you agree to our{" "}
          <Link to="/" className="text-neutral-400 hover:text-white transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
