
import { User, UserData, Transaction, TransactionType, Pot, Profile, Task, Plan, FinancialPlan } from '../types';

const DATA_PREFIX = 'ff_data_v2_';
const SESSION_KEY = 'ff_session_v2';
const DEFAULT_USER_ID = 'local-user';

// Initial Mock Data used for new users - CLEARED as per request
const initialTransactions: Transaction[] = [];

const initialPots: Pot[] = [];

// Helper functions to handle data persistence
const saveUserDataHelper = (userId: string, data: UserData) => {
  localStorage.setItem(DATA_PREFIX + userId, JSON.stringify(data));
};

const loadUserDataHelper = (userId: string): UserData => {
  const dataStr = localStorage.getItem(DATA_PREFIX + userId);
  if (dataStr) {
    return JSON.parse(dataStr);
  }
  // Fallback
  return {
    transactions: [],
    pots: [],
    profile: { name: 'Freelance', age: null, monthlyGoal: 3000, photo: null, badges: ['Nouveau Membre'] },
    plan: 'free',
    xp: 0,
    tasks: [],
    financialPlan: null
  };
};

export const AuthService = {
  // Get the constant default user
  getDefaultUser: (): User => {
    return {
      id: DEFAULT_USER_ID,
      email: 'utilisateur@local.com',
      name: 'Freelance',
      avatar: null
    };
  },

  // Initialize data if it doesn't exist
  initializeDataIfNeeded: () => {
    if (!localStorage.getItem(DATA_PREFIX + DEFAULT_USER_ID)) {
       saveUserDataHelper(DEFAULT_USER_ID, {
        transactions: [],
        pots: [],
        profile: { name: 'Freelance', age: null, monthlyGoal: 3000, photo: null, badges: ['Nouveau Membre'] },
        plan: 'free',
        xp: 0,
        tasks: [],
        financialPlan: null
      });
    }
  },

  loadUserData: loadUserDataHelper,

  saveUserData: saveUserDataHelper,

  // --- Session Management ---

  getSession: (): User | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  guestLogin: async (): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = AuthService.getDefaultUser();
    AuthService.initializeDataIfNeeded();
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // --- Authentication Methods ---

  login: async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!email || !password) {
      throw new Error("Email et mot de passe requis.");
    }

    // For demo purposes, we'll use a simple deterministic ID based on email.
    // In a real app, this would call a backend API.
    const id = email === 'utilisateur@local.com' ? DEFAULT_USER_ID : btoa(email);

    const user: User = {
      id,
      email,
      name: email.split('@')[0], // Derive name from email for demo
      avatar: null
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!email || !password || !name) {
      throw new Error("Tous les champs sont requis.");
    }

    const id = btoa(email);

    // Check if mock user already exists in local storage to prevent overwrite (optional for demo)
    if (localStorage.getItem(DATA_PREFIX + id)) {
        throw new Error("Un compte existe déjà avec cet email.");
    }

    // Initialize default data for the new user
    saveUserDataHelper(id, {
      transactions: [],
      pots: [],
      profile: { name: name, age: null, monthlyGoal: 3000, photo: null, badges: ['Nouveau Membre'] },
      plan: 'free',
      xp: 0,
      tasks: [],
      financialPlan: null
    });

    const user: User = {
      id,
      email,
      name,
      avatar: null
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  googleLogin: async (): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock Google User
    const user: User = {
      id: 'google-demo-user',
      email: 'demo@gmail.com',
      name: 'Utilisateur Google',
      avatar: null
    };

    // Initialize data if it doesn't exist for this user
    if (!localStorage.getItem(DATA_PREFIX + user.id)) {
      saveUserDataHelper(user.id, {
        transactions: [],
        pots: [],
        profile: { name: user.name, age: null, monthlyGoal: 3000, photo: null, badges: ['Nouveau Membre'] },
        plan: 'free',
        xp: 0,
        tasks: [],
        financialPlan: null
      });
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
};
