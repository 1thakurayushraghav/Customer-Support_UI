"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user?: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  isLoading: true,
  login: () => { },
  logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ======================
  // INIT AUTH (SAFE HYDRATION)
  // ======================
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");

    if (t) setToken(t);

    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // ======================
  // LOGIN
  // ======================
  const login = useCallback((newToken: string, newUser?: User) => {
    localStorage.setItem("token", newToken);

    if (newUser) {
      const safeUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || "user",
      };

      localStorage.setItem("user", JSON.stringify(safeUser));
      setUser(safeUser);
    }

    setToken(newToken);
  }, []);

  // ======================
  // LOGOUT (FIXED - IMPORTANT)
  // ======================
  const logout = useCallback(() => {
    // 1. Clear storage FIRST
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    // 2. Reset state
    setToken(null);
    setUser(null);

    // 3. HARD redirect (important for layout sync issue)
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ token, user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}