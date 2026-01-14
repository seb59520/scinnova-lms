import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserRole } from '../hooks/useUserRole';
import { getUserOrg } from '../lib/queries/userQueries';
import type { Org } from '../types/database';
import { Building2, LogOut, User, ChevronDown, Settings, Home } from 'lucide-react';
import { NotificationCenter } from './notifications/NotificationCenter';
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow">
      <div className="w-full px-2 sm:px-3">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo, Title and back button */}
          <div className="flex items-center space-x-4 flex-1">
            {showBackButton && (
              <Link
                to={backTo}
                className="text-blue-600 hover:text-blue-500 flex items-center"
              >
                ← {backLabel}
              </Link>
            )}
            <div className="flex items-center space-x-3">
              <img 
                src={logoScinnova} 
                alt="SCINNOVA" 
                className="h-16 w-auto"
              />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            </div>
            {children}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Centre de notifications */}
            <NotificationCenter />
            
            {isAdmin && (
              <Link
                to="/admin/documentation"
                className="text-sm text-gray-600 hover:text-gray-900 hidden md:block"
                title="Documentation (Admin)"
              >
                Documentation
              </Link>
            )}

            {/* User menu dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
                aria-label="Menu utilisateur"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {userInitials}
                </div>

                {/* User info - hidden on mobile */}
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>

                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                    {/* User info section */}
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{roleLabel}</p>
                      {org && !isAdmin && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{org.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      <Link
                        to="/landing"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Home className="h-4 w-4" />
                        Page d'accueil
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Mon profil
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowMenu(false)}
                          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Administration
                        </Link>
                      )}
                      <div className="border-t border-gray-200 my-2" />
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

