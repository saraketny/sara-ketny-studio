import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Heart, Sparkles, Image as ImageIcon, ShieldCheck, Lock, Unlock, LogOut, 
  Settings, Grid, Layers, FolderTree, Palette, Users, Menu, X, Search, 
  Filter, ChevronRight, Plus, Edit2, Trash2, Eye, EyeOff, Upload, CheckCircle2, 
  AlertCircle, ArrowRight, MessageSquare, Instagram, Mail, Globe, HelpCircle, FileText
} from 'lucide-react';

/* ==========================================
   TYPES & INTERFACES
   ========================================== */
interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  active: boolean;
  created_at?: string;
}

interface Quadro {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  image_path: string;
  thumbnail_path: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
  category?: Category;
}

interface SiteSettings {
  id: string;
  site_name: string;
  tagline: string;
  description: string;
  logo_path: string;
  favicon_path: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  button_color: string;
  font_primary: string;
  font_secondary: string;
  price: number;
  whatsapp: string;
  instagram: string;
  email: string;
  footer_text: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'customer';
  created_at: string;
}

/* ==========================================
   SUPABASE CLIENT CONFIGURATION (WINDOW SUPABASE)
   ========================================== */
const SUPABASE_URL = typeof (window as any).__supabase_url !== 'undefined' ? (window as any).__supabase_url : 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = typeof (window as any).__supabase_anon_key !== 'undefined' ? (window as any).__supabase_anon_key : 'your-anon-key';

// Safe wrapper around window.supabase if loaded via CDN, or fallback mock client
export const supabase = (window as any).supabase?.createClient 
  ? (window as any).supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase CDN client not loaded.' } }),
        signInWithOAuth: async () => ({ error: { message: 'Supabase CDN client not loaded.' } }),
        signOut: async () => {}
      },
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }),
          limit: () => ({ single: async () => ({ data: null, error: null }) }),
          order: async () => ({ data: [], error: null })
        })
      })
    };

/* ==========================================
   REACT CONTEXTS
   ========================================== */
interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

const useAuth = () => useContext(AuthContext);

/* ==========================================
   DEFAULT MOCK DATA FOR FALLBACK/DEMO
   ========================================== */
const DEFAULT_SETTINGS: SiteSettings = {
  id: 'default',
  site_name: 'Sara Ketny Studio',
  tagline: 'Quadros de Nascimento Digitais Personalizados',
  description: 'Artes delicadas, afetivas e personalizadas para transformar os primeiros momentos da vida em uma lembrança para sempre.',
  logo_path: '',
  favicon_path: '',
  primary_color: '#71553f',
  secondary_color: '#b89a73',
  background_color: '#fffdf8',
  text_color: '#55473c',
  button_color: '#71553f',
  font_primary: 'Georgia',
  font_secondary: 'Georgia',
  price: 2.00,
  whatsapp: '5531999999999',
  instagram: 'saraketnystudio',
  email: 'contato@saraketny.com',
  footer_text: 'DELICADEZA EM CADA DETALHE'
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-boy', name: 'Menino', slug: 'menino', parent_id: null, sort_order: 1, active: true },
  { id: 'cat-girl', name: 'Menina', slug: 'menina', parent_id: null, sort_order: 2, active: true },
  { id: 'cat-uni', name: 'Unissex', slug: 'unissex', parent_id: null, sort_order: 3, active: true },
  
  // Subcategories
  { id: 'sub-boy-dino', name: 'Dinossauros', slug: 'dinossauros', parent_id: 'cat-boy', sort_order: 1, active: true },
  { id: 'sub-boy-safari', name: 'Safari', slug: 'safari', parent_id: 'cat-boy', sort_order: 2, active: true },
  { id: 'sub-girl-animals', name: 'Animais', slug: 'animais-menina', parent_id: 'cat-girl', sort_order: 1, active: true },
  { id: 'sub-uni-garden', name: 'Jardim', slug: 'jardim', parent_id: 'cat-uni', sort_order: 1, active: true },
];

const DEFAULT_QUADROS: Quadro[] = [
  {
    id: 'q-1',
    category_id: 'sub-boy-dino',
    name: 'Quadro Nascimento Dinossauros',
    slug: 'quadro-nascimento-dinossauros',
    description: 'Composição delicada com dinossauros aquarelas em tons suaves de verde sálvia e bege.',
    image_path: 'Quadro Nascimento Dinossauros.jpg',
    thumbnail_path: '',
    sort_order: 1,
    active: true
  }
];

/* ==========================================
   MAIN APP COMPONENT & ROUTER
   ========================================== */
export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [selectedQuadroId, setSelectedQuadroId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [quadros, setQuadros] = useState<Quadro[]>(DEFAULT_QUADROS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    let isMounted = true;
    
    async function initAuthAndData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          setUser(session.user);
          fetchProfile(session.user.id);
        }
      } catch (err) {
        console.warn('Supabase session warning:', err);
      } finally {
        if (isMounted) setLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      });

      fetchAppData();

      return () => {
        isMounted = false;
        subscription?.unsubscribe?.();
      };
    }

    initAuthAndData();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data);
      } else if (error) {
        setProfile({
          id: userId,
          email: user?.email || '',
          full_name: 'Administradora',
          role: userId === 'admin-mock' ? 'admin' : 'customer',
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Profile fetch note:', e);
    }
  };

  const fetchAppData = async () => {
    try {
      const { data: settingsData } = await supabase.from('site_settings').select('*').limit(1).single();
      if (settingsData) setSettings(settingsData);

      const { data: catData } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (catData && catData.length > 0) setCategories(catData);

      const { data: quadData } = await supabase.from('quadros').select('*').order('sort_order', { ascending: true });
      if (quadData && quadData.length > 0) setQuadros(quadData);
    } catch (e) {
      console.warn('Using default demo state due to Supabase connection absence.');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCurrentRoute('home');
    showToast('Sessão encerrada com sucesso.');
  };

  const isAdmin = profile?.role === 'admin';

  const dynamicStyles = `
    :root {
      --primary: ${settings.primary_color || '#71553f'};
      --secondary: ${settings.secondary_color || '#b89a73'};
      --bg-color: ${settings.background_color || '#fffdf8'};
      --text-color: ${settings.text_color || '#55473c'};
      --btn-color: ${settings.button_color || '#71553f'};
    }
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: '${settings.font_primary}', Georgia, serif;
    }
  `;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signOut }}>
      <style>{dynamicStyles}</style>
      
      <div className="min-h-screen flex flex-col selection:bg-[#b89a73]/20">
        {currentRoute === 'home' && <HomeView setCurrentRoute={setCurrentRoute} settings={settings} quadros={quadros} categories={categories} />}
        {currentRoute === 'catalog' && <CatalogView setCurrentRoute={setCurrentRoute} setSelectedQuadroId={setSelectedQuadroId} settings={settings} categories={categories} quadros={quadros} />}
        {currentRoute === 'detail' && <QuadroDetailView quadroId={selectedQuadroId} setCurrentRoute={setCurrentRoute} settings={settings} quadros={quadros} />}
        {currentRoute === 'login' && <LoginView setCurrentRoute={setCurrentRoute} showToast={showToast} />}
        {currentRoute.startsWith('/admin') && isAdmin && <AdminDashboardView currentRoute={currentRoute} setCurrentRoute={setCurrentRoute} settings={settings} setSettings={setSettings} categories={categories} setCategories={setCategories} quadros={quadros} setQuadros={setQuadros} showToast={showToast} />}
        {currentRoute.startsWith('/admin') && !isAdmin && <AccessDeniedView setCurrentRoute={setCurrentRoute} />}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#4e3c2e] text-white px-5 py-3 rounded-full text-xs tracking-wider z-50 shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}
    </AuthContext.Provider>
  );
}

/* ==========================================
   HOME VIEW
   ========================================== */
function HomeView({ setCurrentRoute, settings, quadros, categories }: any) {
  const { user, profile, isAdmin } = useAuth();

  return (
    <div className="flex-1 flex flex-col">
      <header className="w-full px-6 py-6 flex items-center justify-between border-b border-[#71553f]/15 bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRoute('home')}>
          {settings.logo_path ? (
            <img src={settings.logo_path} alt={settings.site_name} className="h-10 object-contain" />
          ) : (
            <div>
              <span className="text-xl tracking-wider text-[#71553f] font-normal">{settings.site_name}</span>
              <span className="block text-[9px] tracking-[4px] text-[#89796b]">S T U D I O</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentRoute('catalog')}
            className="px-5 py-2.5 rounded-full border border-[#71553f]/30 text-xs tracking-widest text-[#4d392c] hover:bg-[#71553f] hover:text-white transition-all shadow-sm"
          >
            Ver Catálogo
          </button>

          {isAdmin ? (
            <button 
              onClick={() => setCurrentRoute('/admin')}
              className="px-5 py-2.5 rounded-full bg-[#71553f] text-white text-xs tracking-widest hover:bg-[#4d392c] transition-all shadow-md flex items-center gap-2"
            >
              <Settings size={14} /> Painel Admin
            </button>
          ) : user ? (
            <button 
              onClick={() => setCurrentRoute('catalog')}
              className="px-4 py-2.5 rounded-full bg-[#f1eadf] text-[#71553f] text-xs tracking-widest font-medium"
            >
              Olá, {profile?.full_name || user.email?.split('@')[0]}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentRoute('login')}
              className="px-5 py-2.5 rounded-full bg-[#71553f] text-white text-xs tracking-widest hover:bg-[#4d392c] transition-all shadow-md"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center md:text-left">
          <span className="inline-block text-[#b89a73] tracking-[4px] uppercase text-xs font-medium">
            Coleção Exclusiva & Afetiva
          </span>
          <h1 className="text-4xl md:text-6xl font-normal leading-tight text-[#4d392c]">
            Quadros de
            <span className="block italic text-[#71553f] mt-1">Nascimento</span>
          </h1>
          <p className="text-[#89796b] text-base md:text-lg leading-relaxed max-w-lg mx-auto md:mx-0">
            {settings.description}
          </p>
          <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
            <button
              onClick={() => setCurrentRoute('catalog')}
              className="px-8 py-4 rounded-full bg-[#71553f] text-white text-sm tracking-widest hover:bg-[#4d392c] transition-all shadow-lg flex items-center gap-3"
            >
              Explorar Catálogo <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setCurrentRoute('catalog')}
              className="px-8 py-4 rounded-full bg-white/80 border border-[#71553f]/20 text-[#71553f] text-sm tracking-widest hover:bg-[#f1eadf] transition-all"
            >
              Continuar como Visitante
            </button>
          </div>
          <div className="pt-2 text-xs text-[#89796b] flex items-center justify-center md:justify-start gap-2">
            <Sparkles size={14} className="text-[#b89a73]" /> Arquivo digital em alta qualidade a partir de R$ {settings.price.toFixed(2).replace('.', ',')}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#b89a73]/30 to-[#71553f]/30 rounded-[35px] blur-xl opacity-70 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative p-6 md:p-8 bg-white/80 backdrop-blur-md rounded-[30px] border border-[#71553f]/15 shadow-2xl">
            <div className="text-[11px] tracking-[3px] text-[#b89a73] uppercase mb-2">Destaque do Estúdio</div>
            <h3 className="text-2xl font-normal text-[#4d392c] italic mb-4">Arte Personalizada & Única</h3>
            <div className="aspect-[210/297] bg-[#eee5d7] rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center">
              {quadros.length > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#f7f2e9] p-8 text-center">
                  <div>
                    <ImageIcon size={48} className="mx-auto text-[#b89a73] mb-3 opacity-60" />
                    <p className="text-sm font-medium text-[#71553f]">{quadros[0].name}</p>
                    <span className="text-[11px] text-[#89796b] mt-1 block">Sara Ketny Studio — Protegido</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-[#89796b]">Nenhum quadro cadastrado</span>
              )}
              <div className="absolute inset-0 pointer-events-none opacity-10 flex flex-wrap items-center justify-around rotate-[-24deg] overflow-hidden">
                <span className="text-xs tracking-widest text-[#71553f]">SARA KETNY STUDIO</span>
                <span className="text-xs tracking-widest text-[#71553f]">SARA KETNY STUDIO</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-[#89796b]">
              <span>Ilustração Aquarela</span>
              <span className="font-semibold text-[#71553f]">R$ {settings.price.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto py-12 bg-[#b0b39f] text-white text-center">
        <div className="tracking-[6px] text-sm uppercase font-light">{settings.site_name}</div>
        <p className="mt-2 text-xs tracking-[2px] opacity-90">{settings.footer_text}</p>
      </footer>
    </div>
  );
}

/* ==========================================
   CATALOG VIEW (PUBLIC & VISITOR)
   ========================================== */
function CatalogView({ setCurrentRoute, setSelectedQuadroId, settings, categories, quadros }: any) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user, profile, isAdmin, signOut } = useAuth();

  const mainCategories = categories.filter((c: Category) => !c.parent_id && c.active);
  const subCategories = categories.filter((c: Category) => c.parent_id && c.active);

  const filteredQuadros = quadros.filter((q: Quadro) => {
    if (!q.active) return false;
    const matchesSearch = q.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    
    const cat = categories.find((c: Category) => c.id === q.category_id);
    if (!cat) return false;
    
    if (cat.id === selectedCategory || cat.parent_id === selectedCategory) {
      return matchesSearch;
    }
    return false;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#f7f2e9]/50 select-none" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#71553f]/15 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRoute('home')}>
          {settings.logo_path ? (
            <img src={settings.logo_path} alt={settings.site_name} className="h-9 object-contain" />
          ) : (
            <div>
              <span className="text-lg tracking-wider text-[#71553f]">{settings.site_name}</span>
              <span className="block text-[8px] tracking-[3px] text-[#89796b]">CATÁLOGO PROTEGIDO</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89796b]" />
            <input 
              type="text" 
              placeholder="Pesquisar quadro..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full border border-[#d9cdbc] text-xs bg-white text-[#55473c] focus:outline-none focus:border-[#71553f] w-64"
            />
          </div>

          {isAdmin ? (
            <button 
              onClick={() => setCurrentRoute('/admin')}
              className="px-4 py-2 rounded-full bg-[#71553f] text-white text-xs tracking-widest hover:bg-[#4d392c] transition-all flex items-center gap-1.5"
            >
              <Settings size={13} /> Admin
            </button>
          ) : user ? (
            <button 
              onClick={signOut}
              className="px-4 py-2 rounded-full border border-[#71553f]/30 text-[#71553f] text-xs tracking-widest flex items-center gap-1.5"
            >
              <LogOut size={13} /> Sair
            </button>
          ) : (
            <button 
              onClick={() => setCurrentRoute('login')}
              className="px-4 py-2 rounded-full bg-[#71553f] text-white text-xs tracking-widest hover:bg-[#4d392c] transition-all"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-1">
        <div className="text-center mb-10">
          <span className="text-[#b89a73] tracking-[4px] uppercase text-xs">Galeria Oficial</span>
          <h2 className="text-3xl md:text-4xl font-normal text-[#4d392c] mt-2">Um tema para cada história</h2>
          <p className="text-[#89796b] text-sm mt-2 max-w-md mx-auto">Navegue pelas categorias e escolha a arte perfeita para eternizar este momento especial.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full text-xs tracking-wider transition-all ${
              selectedCategory === 'all' 
                ? 'bg-[#71553f] text-white shadow-md' 
                : 'bg-white/80 border border-[#d9cdbc] text-[#55473c] hover:bg-[#f1eadf]'
            }`}
          >
            Todos os Quadros
          </button>
          {mainCategories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-xs tracking-wider transition-all ${
                selectedCategory === cat.id 
                  ? 'bg-[#71553f] text-white shadow-md' 
                  : 'bg-white/80 border border-[#d9cdbc] text-[#55473c] hover:bg-[#f1eadf]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {selectedCategory !== 'all' && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {subCategories
              .filter((sub: Category) => sub.parent_id === selectedCategory)
              .map((sub: Category) => (
                <span key={sub.id} className="px-3.5 py-1.5 rounded-full bg-[#e6d4bc]/40 text-[#71553f] text-[11px] tracking-wider">
                  {sub.name}
                </span>
              ))}
          </div>
        )}

        {filteredQuadros.length === 0 ? (
          <div className="text-center py-20 bg-white/60 rounded-3xl border border-[#d9cdbc]/50 p-12">
            <ImageIcon size={48} className="mx-auto text-[#b89a73] mb-4 opacity-50" />
            <h3 className="text-xl text-[#4d392c]">Nenhum quadro encontrado</h3>
            <p className="text-xs text-[#89796b] mt-1">Tente mudar o filtro ou termo de pesquisa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredQuadros.map((quadro: Quadro) => (
              <div 
                key={quadro.id} 
                className="group bg-white rounded-3xl p-4 border border-[#d9cdbc]/60 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[210/297] bg-[#eee5d7] rounded-2xl overflow-hidden relative mb-4 shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-center bg-[#fcf9f4]">
                      <ImageIcon size={32} className="text-[#b89a73] opacity-40" />
                    </div>
                    <div className="absolute inset-0 pointer-events-none opacity-15 flex flex-wrap items-center justify-around rotate-[-24deg] overflow-hidden">
                      <span className="text-[10px] tracking-widest text-[#71553f]">SARA KETNY STUDIO</span>
                      <span className="text-[10px] tracking-widest text-[#71553f]">SARA KETNY STUDIO</span>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-white/80 px-2 py-0.5 rounded-full text-[8px] tracking-wider text-[#71553f] backdrop-blur-sm">
                      © SARA KETNY
                    </div>
                  </div>
                  <h4 className="text-base font-normal text-[#4d392c] group-hover:text-[#71553f] transition-colors">{quadro.name}</h4>
                  <p className="text-xs text-[#89796b] mt-1 line-clamp-2">{quadro.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f1eadf] flex items-center justify-between">
                  <span className="text-xs font-medium text-[#71553f]">R$ {settings.price.toFixed(2).replace('.', ',')}</span>
                  <button
                    onClick={() => {
                      setSelectedQuadroId(quadro.id);
                      setCurrentRoute('detail');
                    }}
                    className="px-4 py-2 rounded-full bg-[#71553f] text-white text-xs tracking-wider hover:bg-[#4d392c] transition-all flex items-center gap-1.5"
                  >
                    Ver Quadro <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto py-10 bg-[#b0b39f] text-white text-center">
        <div className="tracking-[6px] text-sm uppercase font-light">{settings.site_name}</div>
        <p className="mt-2 text-xs tracking-[2px] opacity-90">{settings.footer_text}</p>
      </footer>
    </div>
  );
}

/* ==========================================
   QUADRO DETAIL VIEW
   ========================================== */
function QuadroDetailView({ quadroId, setCurrentRoute, settings, quadros }: any) {
  const quadro = quadros.find((q: Quadro) => q.id === quadroId) || quadros[0];

  const handleWhatsAppOrder = () => {
    const text = encodeURIComponent(`Olá! Gostaria de saber mais sobre o quadro ${quadro?.name || 'de Nascimento'} da Sara Ketny Studio.`);
    window.open(`https://wa.me/${settings.whatsapp}?text=${text}`, '_blank');
  };

  if (!quadro) {
    return (
      <div className="p-10 text-center">
        <p>Quadro não encontrado.</p>
        <button onClick={() => setCurrentRoute('catalog')} className="mt-4 px-4 py-2 bg-[#71553f] text-white rounded-full text-xs">Voltar ao Catálogo</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f2e9]/60 select-none" onContextMenu={(e) => e.preventDefault()}>
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#71553f]/15 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <button 
          onClick={() => setCurrentRoute('catalog')}
          className="px-4 py-2 rounded-full border border-[#71553f]/30 text-xs text-[#71553f] hover:bg-[#71553f] hover:text-white transition-all"
        >
          ← Voltar ao Catálogo
        </button>
        <span className="text-sm tracking-wider text-[#4d392c] font-medium">{settings.site_name}</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 grid md:grid-cols-2 gap-12 items-center">
        <div className="bg-[#eee5d7] p-6 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="aspect-[210/297] bg-white rounded-2xl relative overflow-hidden flex items-center justify-center shadow-inner">
            <ImageIcon size={64} className="text-[#b89a73] opacity-30" />
            <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-wrap items-center justify-around rotate-[-24deg] overflow-hidden">
              <span className="text-sm tracking-widest text-[#71553f]">SARA KETNY STUDIO</span>
              <span className="text-sm tracking-widest text-[#71553f]">SARA KETNY STUDIO</span>
              <span className="text-sm tracking-widest text-[#71553f]">SARA KETNY STUDIO</span>
            </div>
            <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1 rounded-full text-[10px] tracking-wider text-[#71553f] backdrop-blur-sm">
              © SARA KETNY STUDIO — PROTEGIDO
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#e6d4bc] text-[#71553f] text-xs tracking-[2px] uppercase">
            Quadro Digital Exclusivo
          </span>
          <h2 className="text-3xl md:text-5xl font-normal italic text-[#4d392c]">{quadro.name}</h2>
          <p className="text-[#89796b] text-base leading-relaxed">{quadro.description}</p>
          
          <div className="py-4 border-t border-b border-[#71553f]/15 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#89796b] block">Valor do arquivo digital</span>
              <span className="text-2xl font-medium text-[#71553f]">R$ {settings.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="text-right text-xs text-[#89796b]">
              <ShieldCheck size={18} className="inline text-[#b89a73] mr-1" /> Alta Resolução para Impressão
            </div>
          </div>

          <button
            onClick={handleWhatsAppOrder}
            className="w-full py-4 rounded-full bg-[#71553f] text-white text-sm tracking-widest hover:bg-[#4d392c] transition-all shadow-xl flex items-center justify-center gap-3"
          >
            <MessageSquare size={18} /> Quero este Quadro (WhatsApp)
          </button>
        </div>
      </main>

      <footer className="mt-auto py-8 bg-[#b0b39f] text-white text-center">
        <div className="tracking-[6px] text-xs uppercase font-light">{settings.site_name}</div>
      </footer>
    </div>
  );
}

/* ==========================================
   LOGIN VIEW
   ========================================== */
function LoginView({ setCurrentRoute, showToast }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Login realizado com sucesso!');
      setCurrentRoute('/admin');
    } catch (err: any) {
      showToast(err.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      showToast('Google OAuth requer configuração no Supabase.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f2e9] p-6">
      <div className="w-full max-w-md bg-white rounded-[30px] p-8 md:p-10 shadow-2xl border border-[#71553f]/15 relative">
        <button onClick={() => setCurrentRoute('home')} className="absolute top-6 right-6 text-[#89796b] hover:text-[#71553f]">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <span className="text-xs tracking-[4px] text-[#b89a73] uppercase">Acesso Restrito</span>
          <h2 className="text-3xl font-normal text-[#4d392c] mt-2">Sara Ketny Studio</h2>
          <p className="text-xs text-[#89796b] mt-1">Entre com sua conta administrativa ou continue como visitante.</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-[#71553f] mb-1 tracking-wider">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-xl border border-[#d9cdbc] text-sm focus:outline-none focus:border-[#71553f]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#71553f] mb-1 tracking-wider">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-[#d9cdbc] text-sm focus:outline-none focus:border-[#71553f]"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#71553f] text-white text-xs tracking-widest hover:bg-[#4d392c] transition-all shadow-md mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar na Conta'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#f1eadf] space-y-3">
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-full border border-[#d9cdbc] bg-white text-[#4d392c] text-xs tracking-wider hover:bg-[#f7f2e9] transition-all flex items-center justify-center gap-2"
          >
            <span>Continuar com Google</span>
          </button>

          <button 
            onClick={() => setCurrentRoute('catalog')}
            className="w-full py-3 rounded-full bg-[#f1eadf] text-[#71553f] text-xs tracking-wider hover:bg-[#e6d4bc] transition-all"
          >
            Continuar como Visitante
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   ACCESS DENIED VIEW
   ========================================== */
function AccessDeniedView({ setCurrentRoute }: any) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f2e9] p-6 text-center">
      <div className="max-w-md bg-white rounded-3xl p-8 shadow-xl border border-[#71553f]/15">
        <AlertCircle size={48} className="mx-auto text-[#9b635b] mb-4" />
        <h2 className="text-2xl font-normal text-[#4d392c]">Acesso Restrito</h2>
        <p className="text-xs text-[#89796b] mt-2 leading-relaxed">Você está conectado, mas este perfil não possui privilégios de administradora.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={() => setCurrentRoute('catalog')} className="px-5 py-2.5 rounded-full bg-[#71553f] text-white text-xs tracking-wider">Ir ao Catálogo</button>
          <button onClick={signOut} className="px-5 py-2.5 rounded-full border border-[#71553f]/30 text-[#71553f] text-xs tracking-wider">Sair</button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   ADMIN DASHBOARD LAYOUT & VIEWS
   ========================================== */
function AdminDashboardView({ currentRoute, setCurrentRoute, settings, setSettings, categories, setCategories, quadros, setQuadros, showToast }: any) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dash' | 'catalog' | 'categories' | 'appearance' | 'settings'>('dash');

  return (
    <div className="min-h-screen flex bg-[#f5f1eb]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#4d392c] text-white p-6 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-normal tracking-wide">Sara Ketny</h2>
            <span className="text-[10px] tracking-[3px] text-[#b89a73] uppercase">Painel Studio</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('dash')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs tracking-wider transition-all ${activeTab === 'dash' ? 'bg-[#71553f] text-white' : 'text-white/70 hover:bg-white/5'}`}>
            <Grid size={16} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('catalog')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs tracking-wider transition-all ${activeTab === 'catalog' ? 'bg-[#71553f] text-white' : 'text-white/70 hover:bg-white/5'}`}>
            <Layers size={16} /> Gerenciar Quadros
          </button>
          <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs tracking-wider transition-all ${activeTab === 'categories' ? 'bg-[#71553f] text-white' : 'text-white/70 hover:bg-white/5'}`}>
            <FolderTree size={16} /> Categorias & Sub
          </button>
          <button onClick={() => setActiveTab('appearance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs tracking-wider transition-all ${activeTab === 'appearance' ? 'bg-[#71553f] text-white' : 'text-white/70 hover:bg-white/5'}`}>
            <Palette size={16} /> Aparência & Cores
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs tracking-wider transition-all ${activeTab === 'settings' ? 'bg-[#71553f] text-white' : 'text-white/70 hover:bg-white/5'}`}>
            <Settings size={16} /> Configurações Gerais
          </button>
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-3">
          <button onClick={() => setCurrentRoute('catalog')} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs tracking-wider text-white/80 hover:bg-white/5">
            <Globe size={16} /> Ver Catálogo Público
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs tracking-wider text-[#9b635b] hover:bg-white/5">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-20 bg-white border-b border-[#d9cdbc]/50 px-8 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[#4d392c]">
            <Menu size={24} />
          </button>
          <span className="text-sm font-medium text-[#4d392c]">Olá, {profile?.full_name || 'Sara Ketny'}</span>
          <div className="text-xs text-[#89796b]">Área Administrativa Protegida</div>
        </header>

        <main className="p-8 flex-1">
          {activeTab === 'dash' && <AdminDashboardOverview quadros={quadros} categories={categories} settings={settings} />}
          {activeTab === 'catalog' && <AdminQuadrosManager quadros={quadros} setQuadros={setQuadros} categories={categories} showToast={showToast} />}
          {activeTab === 'categories' && <AdminCategoriesManager categories={categories} setCategories={setCategories} showToast={showToast} />}
          {activeTab === 'appearance' && <AdminAppearanceManager settings={settings} setSettings={setSettings} showToast={showToast} />}
          {activeTab === 'settings' && <AdminSettingsManager settings={settings} setSettings={setSettings} showToast={showToast} />}
        </main>
      </div>
    </div>
  );
}

/* ADMIN SUB-VIEWS */
function AdminDashboardOverview({ quadros, categories, settings }: any) {
  const publishedCount = quadros.filter((q: Quadro) => q.active).length;
  const categoriesCount = categories.filter((c: Category) => !c.parent_id).length;
  const subCategoriesCount = categories.filter((c: Category) => c.parent_id).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal text-[#4d392c]">Dashboard do Estúdio</h2>
        <p className="text-xs text-[#89796b] mt-1">Visão geral do catálogo e estatísticas do Sara Ketny Studio.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#d9cdbc]/60 shadow-sm">
          <span className="text-xs text-[#89796b] uppercase tracking-wider">Total de Quadros</span>
          <h3 className="text-3xl font-medium text-[#4d392c] mt-2">{quadros.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#d9cdbc]/60 shadow-sm">
          <span className="text-xs text-[#89796b] uppercase tracking-wider">Quadros Publicados</span>
          <h3 className="text-3xl font-medium text-[#71553f] mt-2">{publishedCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#d9cdbc]/60 shadow-sm">
          <span className="text-xs text-[#89796b] uppercase tracking-wider">Categorias Principais</span>
          <h3 className="text-3xl font-medium text-[#4d392c] mt-2">{categoriesCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#d9cdbc]/60 shadow-sm">
          <span className="text-xs text-[#89796b] uppercase tracking-wider">Subcategorias</span>
          <h3 className="text-3xl font-medium text-[#4d392c] mt-2">{subCategoriesCount}</h3>
        </div>
      </div>
    </div>
  );
}

function AdminQuadrosManager({ quadros, setQuadros, categories, showToast }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [active, setActive] = useState(true);

  const handleAddQuadro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newQuadro: Quadro = {
      id: 'q-' + Date.now(),
      category_id: categoryId || categories[0]?.id,
      name,
      slug: name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      description,
      image_path: 'mock-art.jpg',
      thumbnail_path: '',
      sort_order: quadros.length + 1,
      active
    };
    setQuadros([newQuadro, ...quadros]);
    setName('');
    setDescription('');
    showToast('Quadro adicionado com sucesso!');
  };

  const toggleActive = (id: string) => {
    setQuadros(quadros.map((q: Quadro) => q.id === id ? { ...q, active: !q.active } : q));
    showToast('Status do quadro alterado.');
  };

  const deleteQuadro = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este quadro?')) {
      setQuadros(quadros.filter((q: Quadro) => q.id !== id));
      showToast('Quadro excluído.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal text-[#4d392c]">Gerenciar Quadros</h2>
        <p className="text-xs text-[#89796b] mt-1">Adicione, publique ou oculte artes do catálogo.</p>
      </div>

      <form onSubmit={handleAddQuadro} className="bg-white p-6 rounded-3xl border border-[#d9cdbc]/60 shadow-sm space-y-4">
        <h3 className="text-sm font-medium text-[#71553f] uppercase tracking-wider">Adicionar Novo Quadro</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Nome do Quadro" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required
            className="px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f]"
          />
          <select 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f] bg-white"
          >
            {categories.map((c: Category) => (
              <option key={c.id} value={c.id}>{c.name} {c.parent_id ? '(Sub)' : ''}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="Descrição curta..." 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f]"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="submit" className="px-6 py-2.5 rounded-full bg-[#71553f] text-white text-xs tracking-wider hover:bg-[#4d392c]">
            Salvar Quadro
          </button>
        </div>
      </form>

      <div className="bg-white rounded-3xl border border-[#d9cdbc]/60 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f2e9] border-b border-[#d9cdbc]/40 text-[#71553f] text-xs tracking-wider uppercase">
              <th className="p-4">Nome</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1eadf] text-xs text-[#55473c]">
            {quadros.map((q: Quadro) => (
              <tr key={q.id} className="hover:bg-[#fcf9f4]">
                <td className="p-4 font-medium text-[#4d392c]">{q.name}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] ${q.active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {q.active ? 'Publicado' : 'Oculto'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => toggleActive(q.id)} className="p-2 rounded-lg hover:bg-[#f1eadf] text-[#71553f]" title="Alternar Visibilidade">
                    {q.active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => deleteQuadro(q.id)} className="p-2 rounded-lg hover:bg-rose-50 text-[#9b635b]" title="Excluir">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCategoriesManager({ categories, setCategories, showToast }: any) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name,
      slug: name.toLowerCase().replace(/ /g, '-'),
      parent_id: parentId === 'null' ? null : parentId,
      sort_order: categories.length + 1,
      active: true
    };
    setCategories([...categories, newCat]);
    setName('');
    showToast('Categoria criada com sucesso!');
  };

  const deleteCategory = (id: string) => {
    if (window.confirm('Deseja excluir esta categoria?')) {
      setCategories(categories.filter((c: Category) => c.id !== id && c.parent_id !== id));
      showToast('Categoria excluída.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal text-[#4d392c]">Categorias & Subcategorias</h2>
        <p className="text-xs text-[#89796b] mt-1">Organize a hierarquia do catálogo.</p>
      </div>

      <form onSubmit={handleAddCategory} className="bg-white p-6 rounded-3xl border border-[#d9cdbc]/60 shadow-sm space-y-4">
        <h3 className="text-sm font-medium text-[#71553f] uppercase tracking-wider">Nova Categoria ou Subcategoria</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="Nome da Categoria" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            required
            className="px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f]"
          />
          <select 
            value={parentId || 'null'} 
            onChange={(e) => setParentId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f] bg-white"
          >
            <option value="null">Categoria Principal</option>
            {categories.filter((c: Category) => !c.parent_id).map((c: Category) => (
              <option key={c.id} value={c.id}>Subcategoria de: {c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" className="px-6 py-2.5 rounded-full bg-[#71553f] text-white text-xs tracking-wider hover:bg-[#4d392c]">
            Criar Categoria
          </button>
        </div>
      </form>

      <div className="bg-white rounded-3xl border border-[#d9cdbc]/60 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f2e9] border-b border-[#d9cdbc]/40 text-[#71553f] text-xs tracking-wider uppercase">
              <th className="p-4">Nome</th>
              <th className="p-4">Tipo</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1eadf] text-xs text-[#55473c]">
            {categories.map((c: Category) => (
              <tr key={c.id} className="hover:bg-[#fcf9f4]">
                <td className="p-4 font-medium text-[#4d392c]">{c.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${c.parent_id ? 'bg-amber-50 text-amber-700' : 'bg-[#e6d4bc]/40 text-[#71553f]'}`}>
                    {c.parent_id ? 'Subcategoria' : 'Principal'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => deleteCategory(c.id)} className="p-2 rounded-lg hover:bg-rose-50 text-[#9b635b]" title="Excluir">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminAppearanceManager({ settings, setSettings, showToast }: any) {
  const [form, setForm] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(form);
    showToast('Aparência atualizada com sucesso!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal text-[#4d392c]">Aparência & Cores</h2>
        <p className="text-xs text-[#89796b] mt-1">Personalize o visual do catálogo sem mexer em código.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#d9cdbc]/60 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#71553f] mb-1">Cor Primária</label>
            <input 
              type="color" 
              value={form.primary_color} 
              onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              className="w-full h-10 rounded-xl border border-[#d9cdbc] p-1 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs text-[#71553f] mb-1">Cor Secundária</label>
            <input 
              type="color" 
              value={form.secondary_color} 
              onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
              className="w-full h-10 rounded-xl border border-[#d9cdbc] p-1 cursor-pointer"
            />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" className="px-6 py-2.5 rounded-full bg-[#71553f] text-white text-xs tracking-wider hover:bg-[#4d392c]">
            Salvar Aparência
          </button>
        </div>
      </div>
    </form>
  );
}

function AdminSettingsManager({ settings, setSettings, showToast }: any) {
  const [form, setForm] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(form);
    showToast('Configurações salvas com sucesso!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-normal text-[#4d392c]">Configurações Gerais</h2>
        <p className="text-xs text-[#89796b] mt-1">Defina WhatsApp, preço e dados do estúdio.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-[#d9cdbc]/60 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#71553f] mb-1">Nome do Estúdio</label>
            <input 
              type="text" 
              value={form.site_name} 
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#71553f] mb-1">WhatsApp (com DDI e DDD)</label>
            <input 
              type="text" 
              value={form.whatsapp} 
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#71553f] mb-1">Preço Atual (R$)</label>
            <input 
              type="number" 
              step="0.01"
              value={form.price} 
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#71553f] mb-1">E-mail de Contato</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[#d9cdbc] text-xs focus:outline-none focus:border-[#71553f]"
            />
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" className="px-6 py-2.5 rounded-full bg-[#71553f] text-white text-xs tracking-wider hover:bg-[#4d392c]">
            Salvar Configurações
          </button>
        </div>
      </div>
    </form>
  );
}