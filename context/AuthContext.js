import { createContext, useContext, useEffect, useState } from 'react';
import { isAdminEmail, isValidAdminLogin } from '../constants/admin';
import { isStandaloneApp } from '../constants/standalone';
import { fetchProfileAvatar } from '../api/profileApi';
import { clearSession, loadSession, saveSession } from '../storage/session';
import {
  clearLocalProfile,
  DEFAULT_LOCAL_PROFILE,
  loadLocalProfile,
  saveLocalProfile,
} from '../storage/localProfile';
import { resolveServerMediaUrl } from '../utils/resolveServerMediaUrl';
import {
  generatePlaceholderImageFile,
  getAccentColorFromLabel,
} from '../utils/generatePlaceholderImage';

const AuthContext = createContext(null);

function createUser(email) {
  const trimmed = email.trim().toLowerCase();
  const name = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  return {
    email: trimmed,
    name,
    role: isAdminEmail(trimmed) ? 'admin' : 'user',
    avatarUri: null,
    avatarAccentColor: '#000000',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (isStandaloneApp()) {
          const profile = await loadLocalProfile();
          if (cancelled) return;

          setUser(profile);
          setIsLoading(false);

          if (!profile.avatarUri) {
            const label = profile.name || DEFAULT_LOCAL_PROFILE.name;
            generatePlaceholderImageFile(label, { subdir: 'profile-avatars' })
              .then(async (avatarUri) => {
                if (cancelled || !avatarUri) return;
                const updated = {
                  ...profile,
                  avatarUri,
                  avatarAccentColor: getAccentColorFromLabel(label),
                };
                await saveLocalProfile(updated);
                if (!cancelled) setUser(updated);
              })
              .catch(() => {});
          }
          return;
        }

        const savedUser = await loadSession();
        if (cancelled) return;

        if (savedUser) {
          let avatarUri = savedUser.avatarUri || null;

          if (savedUser.email) {
            try {
              const remote = await fetchProfileAvatar(savedUser.email);
              if (remote?.avatarUrl) {
                avatarUri = remote.avatarUrl;
              }
            } catch {
              // API offline — локальный файл
            }
          }

          if (avatarUri) {
            avatarUri = resolveServerMediaUrl(avatarUri) || avatarUri;
          }

          setUser({
            role: 'user',
            avatarAccentColor: '#000000',
            ...savedUser,
            avatarUri,
          });
        }
      } catch {
        if (!cancelled) {
          setUser(isStandaloneApp() ? { ...DEFAULT_LOCAL_PROFILE } : null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (email, password) => {
    if (!email.trim() || !password) {
      return { ok: false, error: 'Введите email и пароль' };
    }
    if (isAdminEmail(email) && !isValidAdminLogin(email, password)) {
      return { ok: false, error: 'Неверный логин или пароль администратора' };
    }
    const newUser = createUser(email);
    setUser(newUser);
    saveSession(newUser);
    return { ok: true, user: newUser };
  };

  const register = (email, password) => {
    if (!email.trim() || !password) {
      return { ok: false, error: 'Заполните все поля' };
    }
    if (isAdminEmail(email)) {
      return { ok: false, error: 'Для админа используйте вход, не регистрацию' };
    }
    if (password.length < 4) {
      return { ok: false, error: 'Пароль минимум 4 символа' };
    }
    const newUser = createUser(email);
    setUser(newUser);
    saveSession(newUser);
    return { ok: true };
  };

  const logout = async () => {
    if (isStandaloneApp()) {
      await clearLocalProfile();
      setUser({ ...DEFAULT_LOCAL_PROFILE });
      return;
    }
    setUser(null);
    await clearSession();
  };

  const persistUser = (updated) => {
    setUser(updated);
    const savePromise =
      isStandaloneApp() || updated.isLocal
        ? saveLocalProfile(updated)
        : saveSession(updated);
    savePromise.catch(() => {});
    return updated;
  };

  const updateAvatar = (avatarUri, avatarAccentColor) => {
    if (!user) return;
    persistUser({ ...user, avatarUri, avatarAccentColor });
  };

  const updateProfile = (patch) => {
    if (!user) return;
    const updated = { ...user, ...patch };
    if (patch.name !== undefined) {
      const fallback = user.email?.split('@')[0] || DEFAULT_LOCAL_PROFILE.name;
      updated.name = String(patch.name).trim() || fallback;
    }
    if (patch.bio !== undefined) {
      updated.bio = String(patch.bio).trim();
    }
    persistUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateAvatar,
        updateProfile,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth используется вне AuthProvider');
  }
  return context;
}
