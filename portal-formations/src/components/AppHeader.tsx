import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { getUserOrg } from '../lib/queries/userQueries';
import type { Org } from '../types/database';
import { Building2, LogOut, User, ChevronDown, Settings, Home } from 'lucide-react';
import { NotificationCenter } from './notifications/NotificationCenter';
import { GlobalSearch } from './GlobalSearch';
import { NavigationHistory } from './NavigationHistory';
import { NavigationSuggestions } from './NavigationSuggestions';
import logoScinnova from '../../Logo SCINNOVA avec cerveau et fusée.png';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

export function AppHeader({ 
  title = 'SCINNOVA - LMS',
  showBackButton = false,
  backTo = '/app',
  backLabel = 'Retour',
  children 
}: AppHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { roleLabel, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [org, setOrg] = useState<Org | null>(null);
  useEffect(() => {
    async function loadOrg() {
      if (!user?.id || isAdmin) return; // Pas besoin pour les admins
      
      const { org: userOrg } = await getUserOrg(user.id);
      setOrg(userOrg);
    }
    
    loadOrg();
  }, [user?.id, isAdmin]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      setShowMenu(false);
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const displayName = profile?.full_name || user?.email || 'Utilisateur';
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-4 min-w-0">
            {showBackButton && (
              <Link
                to={backTo}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                ← {backLabel}
              </Link>
            )}
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={logoScinnova} 
                alt="SCINNOVA" 
                className="h-10 w-auto rounded-lg border border-slate-100 bg-white object-contain p-1 shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Portal Formations</p>
                <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
              </div>
            </div>
            {children && <div className="hidden lg:block">{children}</div>}
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch />
            <NavigationHistory />
            <NavigationSuggestions />
            <NotificationCenter />

            {isAdmin && (
              <Link
                to="/admin/documentation"
                className="hidden text-sm text-slate-600 hover:text-slate-900 md:inline-flex"
                title="Documentation (Admin)"
              >
                Documentation
              </Link>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300"
                aria-label="Menu utilisateur"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {userInitials}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold text-slate-900 leading-none">{displayName}</p>
                  <p className="text-xs text-slate-500">{roleLabel}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
                    <div className="border-b border-slate-100 p-4">
                      <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <p className="text-xs text-slate-400 mt-1">{roleLabel}</p>
                      {org && !isAdmin && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{org.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-2">
                      <Link
                        to="/landing"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                      >
                        <Home className="h-4 w-4" />
                        Page d'accueil
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                      >
                        <User className="h-4 w-4" />
                        Mon profil
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowMenu(false)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                        >
                          <Settings className="h-4 w-4" />
                          Administration
                        </Link>
                      )}
                      <div className="my-2 border-t border-slate-100" />
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LogOut className="h-4 w-4" />
                        {signingOut ? 'Déconnexion...' : 'Déconnexion'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
