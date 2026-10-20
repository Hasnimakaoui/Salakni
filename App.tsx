import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search, MapPin, Star, ShieldCheck, Wrench, Zap, Paintbrush, Hammer, Snowflake, Heart, Home, MessageCircle, UserRound, SlidersHorizontal, ChevronLeft, BriefcaseBusiness, Clock3, X, LogOut, Send, Flag, CreditCard, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabase';

type Pro = { id?: string; professionalId?: string; serviceId?: string; isVerified?: boolean; name: string; job: string; city: string; rating: string; jobs: string; price: string; initials: string; color: string; icon: typeof Wrench };
const pros: Pro[] = [
  { name: 'محمد بن يوسف', job: 'كهربائي منازل', city: 'الجزائر — باب الزوار', rating: '4.9', jobs: '126 خدمة', price: 'ابتداءً من 1,500 دج', initials: 'م', color: 'mint', icon: Zap },
  { name: 'ياسين مراد', job: 'سبّاك محترف', city: 'الجزائر — الدار البيضاء', rating: '4.8', jobs: '98 خدمة', price: 'ابتداءً من 1,200 دج', initials: 'ي', color: 'blue', icon: Wrench },
  { name: 'أمين قادري', job: 'دهان وديكور', city: 'البليدة — وسط المدينة', rating: '4.9', jobs: '74 خدمة', price: 'ابتداءً من 2,000 دج', initials: 'أ', color: 'peach', icon: Paintbrush },
  { name: 'كمال بوعلام', job: 'نجار أثاث', city: 'الجزائر — حسين داي', rating: '4.7', jobs: '61 خدمة', price: 'حسب طبيعة العمل', initials: 'ك', color: 'lavender', icon: Hammer },
  { name: 'رياض شريف', job: 'تصليح المكيفات', city: 'تيبازة — القليعة', rating: '4.8', jobs: '53 خدمة', price: 'ابتداءً من 2,500 دج', initials: 'ر', color: 'mint', icon: Snowflake },
];
const categories = [
  { name: 'كهرباء', icon: Zap, color: 'gold' }, { name: 'سباكة', icon: Wrench, color: 'blue' },
  { name: 'دهان', icon: Paintbrush, color: 'peach' }, { name: 'نجارة', icon: Hammer, color: 'lavender' },
  { name: 'تكييف', icon: Snowflake, color: 'mint' }, { name: 'أعمال منزلية', icon: Home, color: 'pink' },
];

export default function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('الكل');
  const [activeTab, setActiveTab] = useState('الرئيسية');
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('salakni-favorites') || '[]') as string[]; } catch { return []; } });
  const [city, setCity] = useState('كل الولايات');
  const [session, setSession] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [accountType, setAccountType] = useState<'customer'|'professional'>('customer');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [requestPro, setRequestPro] = useState<Pro|null>(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [reviewRequest, setReviewRequest] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [messagesView, setMessagesView] = useState<'requests'|'chats'>('requests');
  const [adminStats, setAdminStats] = useState({ users: 0, services: 0, requests: 0, reports: 0 });
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
  const [reportPro, setReportPro] = useState<Pro | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [livePros, setLivePros] = useState<Pro[]>([]);
  const [directoryLoaded, setDirectoryLoaded] = useState(false);
  const [profileRole, setProfileRole] = useState('customer');
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('standard_monthly');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [subscriptionPayments, setSubscriptionPayments] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('كهرباء');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceWilaya, setServiceWilaya] = useState('الجزائر');
  const [serviceCity, setServiceCity] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.from('professional_directory').select('*').then(({ data, error }) => {
      if (!error && data) setLivePros(data.map((row: any) => {
        const categoryName = String(row.category || row.service_title || 'خدمات منزلية');
        const categoryIcon = /كهرب|electric/i.test(categoryName) ? Zap : /سباك|ماء|plumb/i.test(categoryName) ? Wrench : /دهان|paint/i.test(categoryName) ? Paintbrush : /نجار|wood/i.test(categoryName) ? Hammer : /تكييف|تبريد|air/i.test(categoryName) ? Snowflake : Home;
        const name = String(row.display_name || 'حرفي');
        return { id: row.service_id, professionalId: row.professional_id, serviceId: row.service_id, isVerified: Boolean(row.is_verified), name, job: String(row.service_title || categoryName), city: [row.wilaya, row.city].filter(Boolean).join(' — ') || 'الجزائر', rating: Number(row.average_rating || 0).toFixed(1), jobs: `${Number(row.completed_jobs || 0)} خدمة`, price: row.starting_price_dzd == null ? 'حسب طبيعة العمل' : `ابتداءً من ${Number(row.starting_price_dzd).toLocaleString('fr-DZ')} دج`, initials: name.slice(0, 1), color: 'mint', icon: categoryIcon };
      }));
      setDirectoryLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!supabase || !session?.user) { setMyRequests([]); setIncomingRequests([]); setProfileRole('customer'); return; }
    let cancelled = false;
    const loadAccountData = async () => {
      let { data: profile, error: profileError } = await supabase.from('profiles').select('role,display_name,bio,subscription_active,subscription_ends_at,subscription_plan').eq('id', session.user.id).maybeSingle();
      if (cancelled) return;
      if (profileError) {
        setNotice(`تعذر تحميل ملف الحساب: ${profileError.message}`);
        return;
      }
      // Auth state can arrive before the signup/login flow finishes creating the
      // matching profile row. Repair that race here so professional permissions
      // and account details are loaded correctly on the first screen.
      if (!profile) {
        try {
          await ensureProfile(session.user, session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'مستخدم سلكني');
          const refreshed = await supabase.from('profiles').select('role,display_name,bio').eq('id', session.user.id).maybeSingle();
          if (refreshed.error) throw refreshed.error;
          profile = refreshed.data;
        } catch (error) {
          setNotice(error instanceof Error ? `تعذر إعداد ملف الحساب: ${error.message}` : 'تعذر إعداد ملف الحساب.');
          return;
        }
      }
      if (cancelled) return;
      const role = profile?.role || 'customer'; setProfileRole(role); setProfileName(profile?.display_name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'مستخدم سلكني'); setProfileBio(profile?.bio || ''); setSubscriptionActive(Boolean(profile?.subscription_active && (!profile?.subscription_ends_at || new Date(profile.subscription_ends_at).getTime() > Date.now()))); setSubscriptionEndsAt(profile?.subscription_ends_at || null);
      const customerQuery = await supabase.from('service_requests').select('id,title,details,status,created_at,preferred_at,professional_id,service_id,reviews(id)').eq('customer_id', session.user.id).order('created_at', { ascending: false });
      if (customerQuery.error) { if (!cancelled) setNotice(`تعذر تحميل طلباتك: ${customerQuery.error.message}`); }
      else if (!cancelled) setMyRequests((customerQuery.data || []).map((r: any) => ({ ...r, has_review: Array.isArray(r.reviews) && r.reviews.length > 0 })));
      if (role === 'professional') {
        const incomingQuery = await supabase.from('service_requests').select('id,title,details,status,created_at,preferred_at,customer_id,service_id').eq('professional_id', session.user.id).order('created_at', { ascending: false });
        if (incomingQuery.error) { if (!cancelled) setNotice(`تعذر تحميل طلبات الزبائن: ${incomingQuery.error.message}`); }
        else if (!cancelled) setIncomingRequests(incomingQuery.data || []);
      } else if (!cancelled) setIncomingRequests([]);
      const chatQuery = await supabase.from('conversations').select('id,customer_id,professional_id,created_at').or(`customer_id.eq.${session.user.id},professional_id.eq.${session.user.id}`).order('created_at', { ascending: false });
      if (chatQuery.error) { if (!cancelled) setNotice(`تعذر تحميل المحادثات: ${chatQuery.error.message}`); }
      else if (!cancelled) { const rows = chatQuery.data || []; setConversations(rows); setActiveConversationId(current => current && rows.some((c: any) => c.id === current) ? current : (rows[0]?.id || '')); }
    };
    void loadAccountData();
    return () => { cancelled = true; };
  }, [session]);
  useEffect(() => {
    if (!supabase || !session?.user || !['owner','moderator'].includes(profileRole)) { setAdminReports([]); setAdminAuditLogs([]); return; }
    let cancelled = false;
    const loadAdmin = async () => {
      const [users, services, requests, reports, audit] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('professional_services').select('id', { count: 'exact', head: true }),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id,reason,status,created_at,reported_profile_id,request_id').in('status', ['open','reviewing']).order('created_at', { ascending: false }).limit(30),
        supabase.from('audit_logs').select('id,actor_id,action,entity_type,entity_id,details,created_at').order('created_at', { ascending: false }).limit(10)
      ]);
      if (cancelled) return;
      const failedQuery = [users, services, requests, reports, audit].find(result => result.error);
      if (failedQuery?.error) setNotice(`تعذر تحميل لوحة الإدارة: ${failedQuery.error.message}`);
      setAdminStats({ users: users.count || 0, services: services.count || 0, requests: requests.count || 0, reports: reports.data?.length || 0 });
      setAdminReports(reports.data || []);
      setAdminAuditLogs(audit.data || []);
    };
    void loadAdmin();
    return () => { cancelled = true; };
  }, [session?.user?.id, profileRole]);
  useEffect(() => {
    if (!supabase || !session?.user) { setSubscriptionPayments([]); return; }
    let cancelled = false;
    void supabase.from('subscription_payments').select('id,account_type,plan_code,amount_dzd,transfer_reference,status,admin_note,created_at,subscription_starts_at,subscription_ends_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10).then(({ data, error }) => {
      if (cancelled) return;
      if (error) setNotice(`تعذر تحميل حالة الاشتراك: ${error.message}`);
      else setSubscriptionPayments(data || []);
    });
    return () => { cancelled = true; };
  }, [session?.user?.id]);
  useEffect(() => {
    if (!supabase || !session?.user || !['owner','moderator'].includes(profileRole)) { setAdminPayments([]); return; }
    let cancelled = false;
    void supabase.from('subscription_payments').select('id,user_id,account_type,plan_code,amount_dzd,transfer_reference,receipt_path,status,admin_note,created_at').order('created_at', { ascending: false }).limit(50).then(async ({ data, error }) => {
      if (cancelled) return;
      if (error) { setNotice(`تعذر تحميل دفعات الاشتراك: ${error.message}`); return; }
      const rows = await Promise.all((data || []).map(async (p: any) => {
        if (!p.receipt_path) return p;
        const { data: signed } = await supabase!.storage.from('subscription-receipts').createSignedUrl(p.receipt_path, 300);
        return { ...p, receipt_url: signed?.signedUrl || null };
      }));
      if (!cancelled) setAdminPayments(rows);
    });
    return () => { cancelled = true; };
  }, [session?.user?.id, profileRole]);
  const submitSubscriptionPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user) { setAuthMode('login'); setAuthOpen(true); return; }
    if (!paymentReference.trim()) { setNotice('أدخل رقم العملية أو مرجع التحويل.'); return; }
    if (!paymentReceipt) { setNotice('أرفق صورة أو ملف إثبات الدفع.'); return; }
    if (paymentReceipt.size > 5 * 1024 * 1024) { setNotice('حجم الإثبات يجب ألا يتجاوز 5 ميغابايت.'); return; }
    if (!/\.(jpe?g|png|webp|pdf)$/i.test(paymentReceipt.name)) { setNotice('الصيغ المقبولة: JPG أو PNG أو WEBP أو PDF.'); return; }
    setBusy(true); setNotice('');
    try {
      const safeName = paymentReceipt.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const receiptPath = `${session.user.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('subscription-receipts').upload(receiptPath, paymentReceipt, { upsert: false, contentType: paymentReceipt.type || 'application/octet-stream' });
      if (uploadError) throw uploadError;
      const [accountType, planCode] = subscriptionPlan.split('_');
      const { error } = await supabase.from('subscription_payments').insert({ user_id: session.user.id, account_type: accountType, plan_code: planCode, transfer_reference: paymentReference.trim(), receipt_path: receiptPath, status: 'pending' });
      if (error) { await supabase.storage.from('subscription-receipts').remove([receiptPath]); throw error; }
      const { data, error: reloadError } = await supabase.from('subscription_payments').select('id,account_type,plan_code,amount_dzd,transfer_reference,status,admin_note,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10);
      if (reloadError) throw reloadError;
      setSubscriptionPayments(data || []); setPaymentReference(''); setPaymentReceipt(null);
      setNotice('تم إرسال إثبات الدفع للمراجعة. لن يُفعّل الاشتراك قبل موافقة الإدارة.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر إرسال إثبات الدفع.'); }
    finally { setBusy(false); }
  };
  const reviewSubscriptionPayment = async (id: string, approve: boolean) => {
    if (!supabase) return;
    const note = window.prompt(approve ? 'ملاحظة إدارية (اختياري):' : 'سبب رفض الدفع:') || '';
    if (!approve && note.trim().length < 3) { setNotice('أدخل سببًا واضحًا للرفض.'); return; }
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.rpc('review_subscription_payment', { p_payment_id: id, p_approve: approve, p_admin_note: note.trim() || null });
      if (error) throw error;
      const { data, error: reloadError } = await supabase.from('subscription_payments').select('id,user_id,account_type,plan_code,amount_dzd,transfer_reference,receipt_path,status,admin_note,created_at').order('created_at', { ascending: false }).limit(50);
      if (reloadError) throw reloadError;
      const rows = await Promise.all((data || []).map(async (p: any) => {
        if (!p.receipt_path) return p;
        const { data: signed } = await supabase!.storage.from('subscription-receipts').createSignedUrl(p.receipt_path, 300);
        return { ...p, receipt_url: signed?.signedUrl || null };
      }));
      setAdminPayments(rows);
      if (session?.user?.id === rows.find((p: any) => p.id === id)?.user_id) {
        const refreshed = await supabase.from('profiles').select('subscription_active,subscription_ends_at').eq('id', session.user.id).maybeSingle();
        setSubscriptionActive(Boolean(refreshed.data?.subscription_active)); setSubscriptionEndsAt(refreshed.data?.subscription_ends_at || null);
      }
      setNotice(approve ? 'تمت الموافقة على الدفع وتفعيل الاشتراك.' : 'تم رفض الدفع.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر مراجعة الدفع.'); }
    finally { setBusy(false); }
  };
  const resolveReport = async (id: string, status: 'resolved'|'dismissed') => {
    if (!supabase) return;
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.from('reports').update({ status, reviewed_by: session?.user?.id }).eq('id', id);
      if (error) throw error;
      setAdminReports(rows => rows.filter(r => r.id !== id));
      setAdminStats(prev => ({ ...prev, reports: Math.max(0, prev.reports - 1) }));
      const { data: latestAudit } = await supabase.from('audit_logs').select('id,actor_id,action,entity_type,entity_id,details,created_at').order('created_at', { ascending: false }).limit(10);
      if (latestAudit) setAdminAuditLogs(latestAudit);
      setNotice(status === 'resolved' ? 'تم إغلاق البلاغ بعد المراجعة.' : 'تم استبعاد البلاغ.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر تحديث البلاغ.'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!supabase || !session?.user || !activeConversationId) { setChatMessages([]); return; }
    let cancelled = false;
    const loadMessages = async () => {
      const { data, error } = await supabase.from('messages').select('id,sender_id,body,created_at').eq('conversation_id', activeConversationId).order('created_at', { ascending: true }).limit(200);
      if (cancelled) return;
      if (error) setNotice(`تعذر تحميل الرسائل: ${error.message}`);
      else setChatMessages(data || []);
    };
    void loadMessages();
    const channel = supabase.channel(`salakni-chat-${activeConversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversationId}` }, payload => {
      const row = payload.new as any;
      if (!cancelled) setChatMessages(current => current.some(m => m.id === row.id) ? current : [...current, row]);
    }).subscribe();
    return () => { cancelled = true; void supabase?.removeChannel(channel); };
  }, [session?.user?.id, activeConversationId]);
  const sendChatMessage = async (e: FormEvent) => {
    e.preventDefault();
    const body = messageDraft.trim();
    if (!supabase || !session?.user || !activeConversationId || !body) return;
    if (body.length > 5000) { setNotice('الرسالة طويلة جدًا.'); return; }
    setBusy(true); setNotice('');
    try {
      const { data, error } = await supabase.from('messages').insert({ conversation_id: activeConversationId, sender_id: session.user.id, body }).select('id,sender_id,body,created_at').single();
      if (error) throw error;
      setChatMessages(rows => rows.some(m => m.id === data.id) ? rows : [...rows, data]); setMessageDraft('');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر إرسال الرسالة.'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    try { localStorage.setItem('salakni-favorites', JSON.stringify(favorites)); } catch { /* storage may be disabled */ }
  }, [favorites]);
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user) return;
    const name = profileName.trim();
    if (name.length < 2 || name.length > 60) { setNotice('الاسم يجب أن يكون بين حرفين و60 حرفًا.'); return; }
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.from('profiles').update({ display_name: name, bio: profileBio.trim() || null }).eq('id', session.user.id);
      if (error) throw error;
      setNotice('تم حفظ بيانات حسابك.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر حفظ البيانات.'); }
    finally { setBusy(false); }
  };
  const ensureProfile = async (user: any, fallbackName: string) => {
    if (!supabase || !user) throw new Error('تعذر التحقق من حساب المستخدم.');
    const { data, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (data) return;

    const displayName = String(
      fallbackName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'مستخدم سلكني'
    ).trim().slice(0, 60);
    const role = user.user_metadata?.account_type === 'professional' ? 'professional' : 'customer';
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: displayName.length >= 2 ? displayName : 'مستخدم سلكني',
      role
    });
    // A concurrent login may create the same profile after the lookup. Treat only
    // that duplicate-key race as success; surface every other database/RLS error.
    if (insertError && insertError.code !== '23505') throw insertError;
  };
  const submitAuth = async (e: FormEvent) => {
    e.preventDefault(); setNotice('');
    if (!supabase) { setNotice('أضف بيانات مشروع Supabase في إعدادات البناء لتفعيل الحسابات الحقيقية.'); return; }
    setBusy(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword, options: { data: { display_name: authName.trim(), account_type: accountType } } });
        if (error) throw error;
        if (data.session && data.user) await ensureProfile(data.user, authName.trim());
        setNotice(data.session ? 'تم إنشاء الحساب وتسجيل الدخول.' : 'تم إنشاء الحساب. تحقق من بريدك إن كان تأكيد البريد مفعّلًا، ثم سجّل الدخول.');
        if (data.session) setAuthOpen(false); else setAuthMode('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        if (data.user) await ensureProfile(data.user, data.user.user_metadata?.display_name || 'مستخدم سلكني');
        setAuthOpen(false); setNotice('');
      }
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر إكمال العملية. تحقق من البيانات وحاول مجددًا.'); }
    finally { setBusy(false); }
  };
  const submitProfessionalService = async (e: FormEvent) => {
    e.preventDefault(); setNotice('');
    if (!supabase || !session?.user) { setAuthOpen(true); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from('professional_services').insert({ professional_id: session.user.id, title: serviceTitle.trim(), category: serviceCategory, description: serviceDescription.trim() || null, wilaya: serviceWilaya.trim(), city: serviceCity.trim(), starting_price_dzd: servicePrice.trim() ? Number(servicePrice) : null });
      if (error) throw error;
      setNotice('تم نشر الخدمة. ستظهر في دليل سلكني بعد تحديث القائمة.'); setServiceTitle(''); setServiceDescription(''); setServiceCity(''); setServicePrice('');
      const { data } = await supabase.from('professional_directory').select('*');
      if (data) setLivePros(data.map((row: any) => { const categoryName = String(row.category || row.service_title || 'خدمات منزلية'); const categoryIcon = /كهرب|electric/i.test(categoryName) ? Zap : /سباك|ماء|plumb/i.test(categoryName) ? Wrench : /دهان|paint/i.test(categoryName) ? Paintbrush : /نجار|wood/i.test(categoryName) ? Hammer : /تكييف|تبريد|air/i.test(categoryName) ? Snowflake : Home; const name = String(row.display_name || 'حرفي'); return { id: row.service_id, professionalId: row.professional_id, serviceId: row.service_id, isVerified: Boolean(row.is_verified), name, job: String(row.service_title || categoryName), city: [row.wilaya, row.city].filter(Boolean).join(' — ') || 'الجزائر', rating: Number(row.average_rating || 0).toFixed(1), jobs: `${Number(row.completed_jobs || 0)} خدمة`, price: row.starting_price_dzd == null ? 'حسب طبيعة العمل' : `ابتداءً من ${Number(row.starting_price_dzd).toLocaleString('fr-DZ')} دج`, initials: name.slice(0, 1), color: 'mint', icon: categoryIcon }; }));
      setDirectoryLoaded(true);
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر نشر الخدمة.'); } finally { setBusy(false); }
  };
  const submitRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestPro) return;
    if (!supabase || !session?.user) { setRequestPro(null); setAuthMode('login'); setAuthOpen(true); setNotice('سجّل الدخول أولًا حتى نحفظ طلب الخدمة.'); return; }
    setBusy(true); setNotice('');
    try {
      if (!requestPro.professionalId) throw new Error('هذه بطاقة عرض تجريبية وليست ملفًا مسجلًا. اختر حرفيًا منشورًا من قاعدة البيانات لإرسال طلب حقيقي.');
      const { error } = await supabase.from('service_requests').insert({ customer_id: session.user.id, professional_id: requestPro.professionalId, service_id: requestPro.serviceId || null, title: requestPro.job, details: requestDetails.trim() || null, preferred_at: requestDate ? new Date(requestDate).toISOString() : null });
      if (error) throw error;
      setRequestPro(null); setRequestDetails(''); setRequestDate(''); setActiveTab('الرسائل'); setMessagesView('chats');
      const { data: chats } = await supabase.from('conversations').select('id,customer_id,professional_id,created_at').or(`customer_id.eq.${session.user.id},professional_id.eq.${session.user.id}`).order('created_at', { ascending: false });
      if (chats) { setConversations(chats); if (chats[0]) setActiveConversationId(chats[0].id); }
      const { data } = await supabase.from('service_requests').select('id,title,details,status,created_at,professional_id').eq('customer_id', session.user.id).order('created_at', { ascending: false }); setMyRequests(data || []);
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر إرسال الطلب.'); }
    finally { setBusy(false); }
  };
  const submitReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user || !reportPro?.professionalId) { setNotice('سجّل الدخول وأرسل بلاغًا عن ملف مسجّل.'); return; }
    if (reportReason.trim().length < 5) { setNotice('اكتب سبب البلاغ بتفصيل أوضح.'); return; }
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.from('reports').insert({ reporter_id: session.user.id, reported_profile_id: reportPro.professionalId, reason: reportReason.trim() });
      if (error) throw error;
      setReportPro(null); setReportReason(''); setNotice('تم إرسال البلاغ للمراجعة.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر إرسال البلاغ.'); }
    finally { setBusy(false); }
  };
  const updateRequestStatus = async (requestId: string, status: 'accepted'|'in_progress'|'completed'|'cancelled') => {
    if (!supabase || !session?.user) return;
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.from('service_requests').update({ status }).eq('id', requestId);
      if (error) throw error;
      setIncomingRequests(rows => rows.map(r => r.id === requestId ? { ...r, status } : r));
      setMyRequests(rows => rows.map(r => r.id === requestId ? { ...r, status } : r));
      setNotice('تم تحديث حالة الطلب.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر تحديث الطلب.'); }
    finally { setBusy(false); }
  };
  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user || !reviewRequest) return;
    setBusy(true); setNotice('');
    try {
      const { error } = await supabase.from('reviews').insert({ request_id: reviewRequest.id, customer_id: session.user.id, professional_id: reviewRequest.professional_id, rating: reviewRating, comment: reviewComment.trim() || null });
      if (error) throw error;
      setMyRequests(rows => rows.map(r => r.id === reviewRequest.id ? { ...r, has_review: true } : r));
      setReviewRequest(null); setReviewComment(''); setNotice('شكرًا لك، تم إرسال تقييمك.');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر إرسال التقييم. ربما قيّمت هذا الطلب من قبل.'); }
    finally { setBusy(false); }
  };
  const sourcePros = directoryLoaded ? livePros : pros;
  const filtered = useMemo(() => sourcePros.filter(p =>
    (category === 'الكل' || p.job.includes(category) || category === 'أعمال منزلية') &&
    (city === 'كل الولايات' || p.city.includes(city)) &&
    `${p.name} ${p.job} ${p.city}`.toLocaleLowerCase('ar').includes(query.trim().toLocaleLowerCase('ar'))
  ), [sourcePros, query, category, city]);
  const visiblePros = activeTab === 'المفضلة' ? filtered.filter(p => favorites.includes(p.name)) : filtered;
  const toggleFavorite = (name: string) => setFavorites(old => old.includes(name) ? old.filter(x => x !== name) : [...old, name]);

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Wrench size={23}/></div><div><strong>سلكني</strong><span>خدماتك أقرب مما تتخيل</span></div></div>
      <button className="location-pill" onClick={() => setCity(city === 'كل الولايات' ? 'الجزائر' : 'كل الولايات')}><MapPin size={16}/><span>{city}</span><ChevronLeft size={15}/></button>
    </header>
    <main>
      {activeTab === 'الرسائل' ? <section className="section tab-page"><div className="section-heading"><div><span className="section-kicker">إدارة الطلبات</span><h2>{messagesView === 'chats' ? 'المحادثات الخاصة' : (profileRole === 'professional' ? 'طلبات الزبائن' : 'طلباتي للخدمات')}</h2></div>{session && <span className="verified">متصل</span>}</div>{session && <div className="message-view-switch"><button className={messagesView==='requests'?'chosen':''} onClick={()=>setMessagesView('requests')}>الطلبات</button><button className={messagesView==='chats'?'chosen':''} onClick={()=>setMessagesView('chats')}>المحادثات <span>{conversations.length}</span></button></div>}{!session ? <div className="empty-state"><MessageCircle size={30}/><b>سجّل الدخول لمتابعة طلباتك</b><span>تُحفظ طلبات الخدمة في حسابك.</span><button onClick={()=>{setAuthMode('login');setAuthOpen(true)}}>تسجيل الدخول</button></div> : messagesView === 'chats' ? <div className="chat-layout">{conversations.length ? <><div className="conversation-list">{conversations.map(c=><button key={c.id} className={activeConversationId===c.id?'conversation-item selected':'conversation-item'} onClick={()=>setActiveConversationId(c.id)}><span className="conversation-avatar"><MessageCircle size={17}/></span><span><b>{c.customer_id===session.user.id?'محادثة مع الحرفي':'محادثة مع الزبون'}</b><small>{new Date(c.created_at).toLocaleDateString('ar-DZ')}</small></span><ChevronLeft size={16}/></button>)}</div><div className="chat-panel"><div className="chat-message-list">{chatMessages.length ? chatMessages.map(m=><div key={m.id} className={m.sender_id===session.user.id?'chat-bubble mine':'chat-bubble'}><p>{m.body}</p><small>{new Date(m.created_at).toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}</small></div>) : <div className="chat-empty">ابدأ المحادثة برسالة واضحة ومحترمة.</div>}</div><form className="chat-compose" onSubmit={sendChatMessage}><input value={messageDraft} onChange={e=>setMessageDraft(e.target.value)} maxLength={5000} placeholder="اكتب رسالتك…" aria-label="نص الرسالة"/><button disabled={busy || !messageDraft.trim()} type="submit" aria-label="إرسال"><Send size={18}/></button></form></div></> : <div className="empty-state"><MessageCircle size={30}/><b>لا توجد محادثات بعد</b><span>أرسل طلب خدمة لحرفي، وستنشأ محادثة خاصة تلقائيًا.</span><button onClick={()=>setActiveTab('الرئيسية')}>اكتشف الحرفيين</button></div>}</div> : (profileRole === 'professional' ? incomingRequests : myRequests).length ? <div className="request-list">{(profileRole === 'professional' ? incomingRequests : myRequests).map(r=><article className="request-card" key={r.id}><div><b>{r.title}</b><span className="request-status">{({pending:'بانتظار الرد',accepted:'تم القبول',in_progress:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغى'} as Record<string,string>)[r.status] || r.status}</span></div><p>{r.details || 'لم يضف الزبون تفاصيل.'}</p><small>تاريخ الطلب: {new Date(r.created_at).toLocaleDateString('ar-DZ')}{r.preferred_at ? ` · الموعد المطلوب: ${new Date(r.preferred_at).toLocaleString('ar-DZ')}` : ''}</small>{profileRole === 'professional' && <div className="request-actions">{r.status === 'pending' && <><button disabled={busy} onClick={()=>void updateRequestStatus(r.id,'accepted')}>قبول الطلب</button><button className="secondary-action" disabled={busy} onClick={()=>void updateRequestStatus(r.id,'cancelled')}>رفض / إلغاء</button></>}{r.status === 'accepted' && <button disabled={busy} onClick={()=>void updateRequestStatus(r.id,'in_progress')}>بدء العمل</button>}{r.status === 'in_progress' && <button disabled={busy} onClick={()=>void updateRequestStatus(r.id,'completed')}>إنهاء الخدمة</button>}</div>}{profileRole === 'customer' && r.status === 'completed' && !r.has_review && <button className="review-action" onClick={()=>{setReviewRequest(r);setReviewRating(5);setReviewComment('')}}><Star size={15}/> قيّم الخدمة</button>}</article>)}</div> : <div className="empty-state"><MessageCircle size={30}/><b>لا توجد طلبات بعد</b><span>{profileRole === 'professional' ? 'عندما يطلب زبون خدمتك سيظهر طلبه هنا.' : 'اختر حرفيًا منشورًا وأرسل أول طلب خدمة.'}</span><button onClick={()=>setActiveTab('الرئيسية')}>اكتشف الحرفيين</button></div>}</section> : activeTab === 'حسابي' ? <section className="section tab-page"><div className="section-heading"><div><span className="section-kicker">مرحبًا بك</span><h2>حسابك في سلكني</h2></div></div><div className="account-card"><div className="account-avatar"><UserRound size={30}/></div><h3>{session ? (profileName || session.user.email) : 'زائر سلكني'}</h3><p>{session ? 'حسابك متصل ويمكنك متابعة طلباتك ومفضلاتك.' : 'سجّل الدخول لحفظ طلباتك والتواصل مع الحرفيين.'}</p>{session ? <button onClick={async()=>{await supabase?.auth.signOut();setSession(null);setNotice('تم تسجيل الخروج.')}}><LogOut size={16}/> تسجيل الخروج</button> : <button onClick={()=>{setAuthMode('login');setAuthOpen(true)}}>تسجيل الدخول / إنشاء حساب</button>}</div>{session && <div className="professional-form-card"><span className="section-kicker">ملفك الشخصي</span><h3>تعديل بيانات الحساب</h3><form onSubmit={saveProfile}><label>الاسم الظاهر<input required minLength={2} maxLength={60} value={profileName} onChange={e=>setProfileName(e.target.value)}/></label><label>نبذة قصيرة<textarea rows={3} maxLength={1000} value={profileBio} onChange={e=>setProfileBio(e.target.value)} placeholder="اكتب نبذة مختصرة عنك (اختياري)"/></label><button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ الحفظ…':'حفظ البيانات'}</button></form></div>}{session && <div className="subscription-card">
  <div className="subscription-heading"><span className="subscription-icon"><CreditCard size={21}/></span><div><span className="section-kicker">اشتراك سلكني</span><h3>{subscriptionActive ? 'اشتراكك فعّال' : 'فعّل حسابك بالاشتراك'}</h3></div><span className={subscriptionActive ? 'subscription-badge active' : 'subscription-badge'}>{subscriptionActive ? 'نشط' : 'غير نشط'}</span></div>
  {subscriptionEndsAt && <p className="subscription-expiry">ينتهي في {new Date(subscriptionEndsAt).toLocaleDateString('ar-DZ')}</p>}
  <div className="subscription-plans">
    {([['standard_monthly','عادي · شهر','1,000 دج'],['standard_quarterly','عادي · 3 أشهر','2,500 دج'],['standard_yearly','عادي · سنة','9,000 دج'],['pro_monthly','Pro · شهر','1,500 دج'],['pro_quarterly','Pro · 3 أشهر','3,500 دج'],['pro_yearly','Pro · سنة','13,000 دج']] as const).map(([value,label,price])=><label key={value} className={subscriptionPlan===value?'plan-option chosen':'plan-option'}><input type="radio" name="subscriptionPlan" checked={subscriptionPlan===value} onChange={()=>setSubscriptionPlan(value)}/><span><b>{label}</b><strong>{price}</strong></span></label>)}
  </div>
  <p className="subscription-help">حوّل المبلغ عبر BaridiMob أو بريد الجزائر، ثم أرسل مرجع التحويل وإثبات الدفع. يُفعّل الاشتراك بعد مراجعة الإدارة فقط.</p>
  <form className="subscription-payment-form" onSubmit={submitSubscriptionPayment}>
    <label>رقم العملية / مرجع التحويل<input required maxLength={120} value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} placeholder="أدخل مرجع التحويل"/></label>
    <label className="receipt-picker"><Upload size={18}/><span>{paymentReceipt ? paymentReceipt.name : 'إرفاق إثبات الدفع (صورة أو PDF، حتى 5MB)'}</span><input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setPaymentReceipt(e.target.files?.[0] || null)}/></label>
    <button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ الإرسال…':'إرسال إثبات الدفع للمراجعة'}</button>
  </form>
  <h4>سجل طلبات الاشتراك</h4>
  {subscriptionPayments.length ? <div className="subscription-history">{subscriptionPayments.map(p=><article key={p.id}><div><b>{p.account_type==='pro'?'Pro':'عادي'} · {p.plan_code==='monthly'?'شهري':p.plan_code==='quarterly'?'3 أشهر':'سنوي'}</b><strong>{Number(p.amount_dzd).toLocaleString('fr-DZ')} دج</strong></div><small>{new Date(p.created_at).toLocaleDateString('ar-DZ')} · مرجع: {p.transfer_reference}</small><span className={'payment-status '+(p.status==='approved'?'approved':p.status==='rejected'?'rejected':'pending')}>{p.status==='approved'?'مقبول':p.status==='rejected'?'مرفوض':'قيد المراجعة'}</span>{p.admin_note && <p>{p.admin_note}</p>}</article>)}</div> : <p className="subscription-empty">لا توجد طلبات اشتراك بعد.</p>}
</div>}{session && (profileRole === 'owner' || profileRole === 'moderator') && <div className="admin-dashboard"><span className="section-kicker">صلاحيات الإدارة</span><h3>لوحة المتابعة</h3><div className="admin-stat-grid"><div><b>{adminStats.users}</b><span>حسابات</span></div><div><b>{adminStats.services}</b><span>خدمات</span></div><div><b>{adminStats.requests}</b><span>طلبات</span></div><div><b>{adminStats.reports}</b><span>بلاغات مفتوحة</span></div></div><h4>البلاغات التي تحتاج مراجعة</h4>{adminReports.length ? <div className="request-list">{adminReports.map(report=><article className="request-card" key={report.id}><div><b>{report.reason}</b><span className="request-status">{report.status === 'open' ? 'جديد' : 'قيد المراجعة'}</span></div><small>{new Date(report.created_at).toLocaleString('ar-DZ')}</small><div className="request-actions"><button disabled={busy} onClick={()=>void resolveReport(report.id,'resolved')}>تمت المراجعة</button><button className="secondary-action" disabled={busy} onClick={()=>void resolveReport(report.id,'dismissed')}>استبعاد البلاغ</button></div></article>)}</div> : <div className="empty-state"><ShieldCheck size={25}/><b>لا توجد بلاغات مفتوحة</b><span>ستظهر البلاغات الجديدة هنا.</span></div>}<h4>مراجعة دفعات الاشتراك</h4>{adminPayments.length ? <div className="subscription-history admin-payment-list">{adminPayments.map(p=><article key={p.id}><div><b>{p.account_type==='pro'?'Pro':'عادي'} · {p.plan_code==='monthly'?'شهري':p.plan_code==='quarterly'?'3 أشهر':'سنوي'}</b><strong>{Number(p.amount_dzd).toLocaleString('fr-DZ')} دج</strong></div><small>المستخدم: {p.user_id}</small><small>مرجع التحويل: {p.transfer_reference}</small><span className={'payment-status '+(p.status==='approved'?'approved':p.status==='rejected'?'rejected':'pending')}>{p.status==='approved'?'مقبول':p.status==='rejected'?'مرفوض':'قيد المراجعة'}</span>{p.receipt_url && <a className="receipt-link" href={p.receipt_url} target="_blank" rel="noreferrer">عرض إثبات الدفع</a>}{p.admin_note && <p>{p.admin_note}</p>}{p.status==='pending' && <div className="request-actions"><button disabled={busy} onClick={()=>void reviewSubscriptionPayment(p.id,true)}><CheckCircle2 size={15}/> قبول وتفعيل</button><button className="secondary-action" disabled={busy} onClick={()=>void reviewSubscriptionPayment(p.id,false)}><XCircle size={15}/> رفض</button></div>}</article>)}</div> : <p className="audit-log-empty">لا توجد دفعات تنتظر المراجعة.</p>}<h4>سجل التدقيق الأمني</h4>{adminAuditLogs.length ? <div className="audit-log-list">{adminAuditLogs.map(log=><article className="audit-log-item" key={log.id}><div><b>{log.action === 'report_status_changed' ? 'تغيير حالة بلاغ' : log.action === 'request_status_changed' ? 'تغيير حالة طلب خدمة' : String(log.action || 'حدث إداري')}</b><span>{log.entity_type === 'report' ? 'بلاغ' : log.entity_type === 'service_request' ? 'طلب خدمة' : log.entity_type}</span></div><p>{log.details?.from ? `من ${log.details.from} إلى ${log.details.to}` : `السجل رقم ${log.entity_id}`}</p><small>{new Date(log.created_at).toLocaleString('ar-DZ')}</small></article>)}</div> : <p className="audit-log-empty">لا توجد أحداث مسجلة بعد. يظهر السجل بعد تطبيق ترحيل الأمان رقم 002.</p>}</div>}{session && profileRole === 'professional' && <div className="professional-form-card"><span className="section-kicker">ملفك المهني</span><h3>أضف خدمة إلى الدليل</h3><form onSubmit={submitProfessionalService}><label>اسم الخدمة<input required minLength={2} maxLength={100} value={serviceTitle} onChange={e=>setServiceTitle(e.target.value)} placeholder="مثال: إصلاح أعطال الكهرباء"/></label><label>التصنيف<select value={serviceCategory} onChange={e=>setServiceCategory(e.target.value)}><option>كهرباء</option><option>سباكة</option><option>دهان</option><option>نجارة</option><option>تكييف</option><option>أعمال منزلية</option><option>تنظيف</option><option>نقل الأثاث</option></select></label><label>وصف الخدمة<textarea rows={3} maxLength={1500} value={serviceDescription} onChange={e=>setServiceDescription(e.target.value)} placeholder="اشرح خبرتك وما تقدمه"/></label><div className="service-location-fields"><label>الولاية<input required value={serviceWilaya} onChange={e=>setServiceWilaya(e.target.value)} placeholder="الولاية"/></label><label>المدينة<input required value={serviceCity} onChange={e=>setServiceCity(e.target.value)} placeholder="البلدية"/></label></div><label>السعر الابتدائي بالدينار (اختياري)<input type="number" min="0" step="100" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} placeholder="مثال: 1500"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ النشر…':'نشر الخدمة'}</button></form></div>}<div className="account-links"><button onClick={()=>setActiveTab('المفضلة')}><Heart size={18}/> الحرفيون المفضلون <span>{favorites.length}</span></button><button onClick={()=>setActiveTab('الرسائل')}><MessageCircle size={18}/> الرسائل والطلبات <ChevronLeft size={16}/></button></div></section> : <><section className="hero">
        <div className="hero-copy"><span className="eyebrow"><span className="pulse"/> منصتك للخدمات المحلية</span><h1>خدمة مليحة؟<br/><em>تلقاها في سلكني.</em></h1><p>تواصل مع حرفيين موثوقين في منطقتك، وقارن الخدمات بكل سهولة.</p></div>
        <div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="tool-emoji">🧰</div><div className="floating-tag"><ShieldCheck size={16}/> حرفيون موثوقون</div></div>
        <div className="hero-search"><Search size={20}/><input aria-label="ابحث عن خدمة أو حرفي" placeholder="واش راك حاب تصلّح اليوم؟" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>document.getElementById('professionals')?.scrollIntoView({behavior:'smooth'})}>ابحث</button></div>
      </section>
      <section className="trust-row"><div><ShieldCheck/><span><b>حرفيون موثوقون</b><small>ملفات وتقييمات واضحة</small></span></div><div><Clock3/><span><b>وفّر وقتك</b><small>ابحث في مكان واحد</small></span></div><div><BriefcaseBusiness/><span><b>خدمات متنوعة</b><small>اختيارات قريبة منك</small></span></div></section>
      {activeTab === 'الرئيسية' && <section className="section">
        <div className="section-heading"><div><span className="section-kicker">اختار واش تحتاج</span><h2>تصفّح حسب المهنة</h2></div><button className="text-button" onClick={()=>setCategory('الكل')}>كل المهن <ChevronLeft size={16}/></button></div>
        <div className="category-grid">{categories.map(c=>{const Icon=c.icon; return <button key={c.name} className={`category-card ${category===c.name?'selected':''}`} onClick={()=>setCategory(category===c.name?'الكل':c.name)}><span className={`category-icon ${c.color}`}><Icon size={23}/></span><b>{c.name}</b></button>})}</div>
      </section>}
      <section className="section" id="professionals">
        <div className="section-heading"><div><span className="section-kicker">ناس يخدموا بإتقان</span><h2>حرفيون مقترحون</h2></div><button className="filter-button" onClick={()=>setCity(city==='كل الولايات'?'الجزائر':'كل الولايات')}><SlidersHorizontal size={17}/> تصفية</button></div>
        <div className="results-line"><span>{visiblePros.length} حرفيين {activeTab === 'المفضلة' ? 'في المفضلة' : directoryLoaded ? 'في دليل سلكني' : 'في القائمة التجريبية'}</span><span className="sort-label">الأعلى تقييماً <ChevronLeft size={14}/></span></div>
        <div className="pro-list">{visiblePros.map(p=>{const Icon=p.icon; return <article className="pro-card" key={p.id || p.name}><div className={`pro-avatar ${p.color}`}>{p.initials}<span className="online-dot"/></div><div className="pro-info"><div className="pro-name-row"><h3>{p.name}</h3>{p.isVerified && <span className="verified"><ShieldCheck size={14}/> موثّق</span>}</div><p>{p.job}</p><div className="pro-meta"><span><MapPin size={13}/>{p.city}</span><span className="rating"><Star size={13} fill="currentColor"/>{p.rating}</span><span>{p.jobs}</span></div><div className="pro-bottom"><b>{p.price}</b><button onClick={()=>{setRequestPro(p);setRequestDetails('');setRequestDate('')}}>اطلب الخدمة <ChevronLeft size={15}/></button></div></div><button className={`favorite ${favorites.includes(p.name)?'is-favorite':''}`} aria-label="إضافة للمفضلة" onClick={()=>toggleFavorite(p.name)}><Heart size={18} fill={favorites.includes(p.name)?'currentColor':'none'}/></button><button className="report-pro-button" aria-label="الإبلاغ عن الحرفي" title="الإبلاغ عن ملف" onClick={()=>{if(!p.professionalId){setNotice('هذه بطاقة تجريبية؛ لا يمكن إرسال بلاغ عنها قبل تهيئة دليل الحرفيين الحقيقي.');return;}setNotice('');setReportPro(p);setReportReason('')}}><Flag size={14}/></button></article>})}
          {visiblePros.length===0 && <div className="empty-state"><Search size={30}/><b>ما لقيناش نتائج</b><span>جرّب كلمة أخرى أو اختار مهنة مختلفة.</span><button onClick={()=>{setQuery('');setCategory('الكل');if(activeTab==='المفضلة')setActiveTab('الرئيسية')}}>إظهار الكل</button></div>}
        </div>
      </section>
      {activeTab === 'الرئيسية' && <section className="join-banner"><div className="join-icon"><BriefcaseBusiness size={26}/></div><div><h3>أنت حرفي؟ سلكني يعرّف الناس بخدمتك.</h3><p>أنشئ ملفك المهني وابدأ في استقبال طلبات الزبائن.</p></div><button onClick={()=>setActiveTab('حسابي')}>انضم كحرفي <ChevronLeft size={16}/></button></section>}
      {!supabaseConfigured && <p className="config-note">واجهة أولية تعمل محليًا. الحرفيون المعروضون أمثلة تجريبية؛ اضبط متغيرات Supabase لعرض الدليل الحقيقي وتفعيل الحسابات والطلبات.</p>}
      </>}
    </main>
    <nav className="bottom-nav">{[{name:'الرئيسية',icon:Home},{name:'المفضلة',icon:Heart},{name:'الرسائل',icon:MessageCircle},{name:'حسابي',icon:UserRound}].map(t=>{const Icon=t.icon;return <button key={t.name} className={activeTab===t.name?'active':''} onClick={()=>setActiveTab(t.name)}><Icon size={21}/><span>{t.name}</span></button>})}</nav>
    {authOpen && <div className="modal-backdrop" role="presentation" onClick={()=>setAuthOpen(false)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="تسجيل الحساب" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setAuthOpen(false)}><X/></button><span className="section-kicker">مرحبًا بك في سلكني</span><h2>{authMode==='login'?'تسجيل الدخول':'إنشاء حساب جديد'}</h2><form onSubmit={submitAuth}>{authMode==='signup' && <><label>الاسم الكامل<input required minLength={2} value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="اكتب اسمك"/></label><label>نوع الحساب<select value={accountType} onChange={e=>setAccountType(e.target.value as 'customer'|'professional')}><option value="customer">زبون — أبحث عن خدمات</option><option value="professional">حرفي — أقدم خدمات</option></select></label></>}<label>البريد الإلكتروني<input required type="email" autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="name@example.com"/></label><label>كلمة المرور<input required type="password" minLength={6} autoComplete={authMode==='login'?'current-password':'new-password'} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="6 أحرف على الأقل"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ التنفيذ…':authMode==='login'?'دخول آمن':'إنشاء الحساب'} <ChevronLeft size={17}/></button></form>{authMode==='login' && <button className="forgot-password" type="button" onClick={async()=>{setNotice('');if(!supabase){setNotice('أضف إعدادات Supabase أولًا.');return;}if(!authEmail.trim()){setNotice('اكتب بريدك الإلكتروني أولًا.');return;}setBusy(true);const {error}=await supabase.auth.resetPasswordForEmail(authEmail.trim(),{redirectTo:window.location.origin});setBusy(false);setNotice(error?error.message:'إذا كان البريد مسجلًا، فستصلك رسالة لاستعادة كلمة المرور.');}}>نسيت كلمة المرور؟</button>}<p className="switch-auth">{authMode==='login'?'ليس لديك حساب؟':'لديك حساب بالفعل؟'} <button onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setNotice('')}}>{authMode==='login'?'إنشاء حساب':'تسجيل الدخول'}</button></p></section></div>}
    {requestPro && <div className="modal-backdrop" role="presentation" onClick={()=>setRequestPro(null)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="طلب خدمة" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setRequestPro(null)}><X/></button><span className="section-kicker">طلب خدمة جديد</span><h2>{requestPro.job}</h2><p className="modal-subtitle">الحرفي: {requestPro.name} · {requestPro.city}</p><form onSubmit={submitRequest}><label>اشرح ما تحتاجه<textarea rows={4} maxLength={1500} value={requestDetails} onChange={e=>setRequestDetails(e.target.value)} placeholder="اكتب تفاصيل المشكلة والعنوان التقريبي…"/></label><label>الوقت المفضّل (اختياري)<input type="datetime-local" value={requestDate} onChange={e=>setRequestDate(e.target.value)}/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit"><Send size={16}/>{busy?'جارٍ الإرسال…':'إرسال طلب الخدمة'}</button></form></section></div>}
    {reportPro && <div className="modal-backdrop" role="presentation" onClick={()=>setReportPro(null)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="الإبلاغ عن ملف" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setReportPro(null)}><X/></button><span className="section-kicker">حماية مجتمع سلكني</span><h2>الإبلاغ عن {reportPro.name}</h2><p className="modal-subtitle">سيصل البلاغ إلى فريق المراجعة. استخدم هذه الميزة للمخالفات الفعلية.</p><form onSubmit={submitReport}><label>سبب البلاغ<textarea required minLength={5} maxLength={1000} rows={4} value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="اشرح سبب البلاغ…"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ الإرسال…':'إرسال البلاغ'}</button></form></section></div>}
    {reviewRequest && <div className="modal-backdrop" role="presentation" onClick={()=>setReviewRequest(null)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="تقييم الخدمة" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setReviewRequest(null)}><X/></button><span className="section-kicker">رأيك يساعد الآخرين</span><h2>قيّم الخدمة</h2><form onSubmit={submitReview}><label>التقييم</label><div className="rating-picker" dir="ltr">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`${n} نجوم`} className={n<=reviewRating?'rating-selected':''} onClick={()=>setReviewRating(n)}><Star size={28} fill={n<=reviewRating?'currentColor':'none'}/></button>)}</div><label>تعليقك (اختياري)<textarea rows={3} maxLength={1500} value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="كيف كانت تجربتك؟"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ الإرسال…':'إرسال التقييم'}</button></form></section></div>}
    {notice && !authOpen && !requestPro && <button className="toast-notice" onClick={()=>setNotice('')}>{notice} <X size={15}/></button>}
  </div>;
}