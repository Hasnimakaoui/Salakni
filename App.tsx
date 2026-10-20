import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Search, MapPin, Star, ShieldCheck, Wrench, Zap, Paintbrush, Hammer, Snowflake, Heart, Home, MessageCircle, UserRound, SlidersHorizontal, ChevronLeft, BriefcaseBusiness, Clock3, X, LogOut, Send, Flag, PhoneCall, LocateFixed, MapPinned, Navigation } from 'lucide-react';
import { supabase, supabaseConfigured } from './lib/supabase';

type Pro = { id?: string; professionalId?: string; serviceId?: string; isVerified?: boolean; name: string; job: string; city: string; rating: string; jobs: string; price: string; initials: string; color: string; icon: typeof Wrench; description?: string; phone?: string; wilaya?: string; commune?: string; }
const pros: Pro[] = [
  { name: 'محمد بن يوسف', job: 'كهربائي منازل', city: 'الجزائر — باب الزوار', rating: '4.9', jobs: '126 خدمة', price: 'ابتداءً من 1,500 دج', initials: 'م', color: 'mint', icon: Zap },
  { name: 'ياسين مراد', job: 'سبّاك محترف', city: 'الجزائر — الدار البيضاء', rating: '4.8', jobs: '98 خدمة', price: 'ابتداءً من 1,200 دج', initials: 'ي', color: 'blue', icon: Wrench },
  { name: 'أمين قادري', job: 'دهان وديكور', city: 'البليدة — وسط المدينة', rating: '4.9', jobs: '74 خدمة', price: 'ابتداءً من 2,000 دج', initials: 'أ', color: 'peach', icon: Paintbrush },
  { name: 'كمال بوعلام', job: 'نجار أثاث', city: 'الجزائر — حسين داي', rating: '4.7', jobs: '61 خدمة', price: 'حسب طبيعة العمل', initials: 'ك', color: 'lavender', icon: Hammer },
  { name: 'رياض شريف', job: 'تصليح المكيفات', city: 'تيبازة — القليعة', rating: '4.8', jobs: '53 خدمة', price: 'ابتداءً من 2,500 دج', initials: 'ر', color: 'mint', icon: Snowflake },
];
const algeriaWilayas = [
  'كل الولايات','أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر','الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت','غرداية','غليزان','تيميمون','برج باجي مختار','أولاد جلال','بني عباس','عين صالح','عين قزام','تقرت','جانت','المغير','المنيعة'
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
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedCommune, setSelectedCommune] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [currentCoords, setCurrentCoords] = useState<{lat:number;lon:number}|null>(null);
  const [locating, setLocating] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [accountType, setAccountType] = useState<'customer'|'professional'>('customer');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [authProfessionalName, setAuthProfessionalName] = useState('');
  const [professionalNickname, setProfessionalNickname] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'baridimob'|'ccp'>('baridimob');
  const [transferReference, setTransferReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<Record<string, any>>({price_monthly:1000,price_pro_monthly:1500,price_pro_yearly:13000,ccp_account:'',ccp_account_name:'',baridimob_number:'',baridimob_account_name:'',payment_instructions:'حوّل المبلغ ثم أرفق إثبات الدفع. لا يتفعّل الاشتراك إلا بعد مراجعة المالك.'});
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportDraft, setSupportDraft] = useState('');
  const [adminSupportMessages, setAdminSupportMessages] = useState<any[]>([]);
  const [selectedSupportProfessionalId, setSelectedSupportProfessionalId] = useState('');
  const [adminSupportDraft, setAdminSupportDraft] = useState('');

  const [authPassword, setAuthPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [requestPro, setRequestPro] = useState<Pro|null>(null);
  const [profilePro, setProfilePro] = useState<Pro|null>(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [cancelRequestTarget, setCancelRequestTarget] = useState<any | null>(null);
  const [cancelReasonDraft, setCancelReasonDraft] = useState('');
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
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminEditUser, setAdminEditUser] = useState<any | null>(null);
  const [adminEditDraft, setAdminEditDraft] = useState<Record<string, any>>({});
  const [adminServices, setAdminServices] = useState<any[]>([]);
  const [adminRequests, setAdminRequests] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [adminCategories, setAdminCategories] = useState<any[]>([]);
  const [adminAds, setAdminAds] = useState<any[]>([]);
  const [adminSettings, setAdminSettings] = useState<Record<string, any>>({price_monthly:1000,price_pro_monthly:1500,price_pro_yearly:13000,ccp_account:'',ccp_account_name:'',baridimob_number:'',baridimob_account_name:'',payment_instructions:'حوّل المبلغ ثم أرفق إثبات الدفع.'});
  const [adminSection, setAdminSection] = useState('overview');
  const [adminSearch, setAdminSearch] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [adTitleDraft, setAdTitleDraft] = useState('');
  const [adBodyDraft, setAdBodyDraft] = useState('');
  const [adStartDraft, setAdStartDraft] = useState('');
  const [adEndDraft, setAdEndDraft] = useState('');
  const [adminRefreshKey, setAdminRefreshKey] = useState(0);
  const [reportPro, setReportPro] = useState<Pro | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [livePros, setLivePros] = useState<Pro[]>([]);
  const [visibleCategories, setVisibleCategories] = useState(categories);
  const [liveAds, setLiveAds] = useState<any[]>([]);
  const [directoryLoaded, setDirectoryLoaded] = useState(false);
  const [profileRole, setProfileRole] = useState('customer');
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
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
    supabase.from('service_categories').select('name,icon,sort_order').eq('is_active',true).order('sort_order',{ascending:true}).then(({data,error}) => {
      if (!error && data?.length) setVisibleCategories(data.map((row:any) => {
        const n=String(row.name||'');
        const icon=/كهرب/i.test(n)?Zap:/سباك|ماء/i.test(n)?Wrench:/دهان/i.test(n)?Paintbrush:/نجار/i.test(n)?Hammer:/تكييف|تبريد/i.test(n)?Snowflake:Home;
        const color=/كهرب/i.test(n)?'gold':/سباك|ماء/i.test(n)?'blue':/دهان/i.test(n)?'peach':/نجار/i.test(n)?'lavender':'mint';
        return {name:n,icon,color};
      }));
    });
    supabase.from('ads').select('id,title,body,target_url').eq('is_active',true).lte('starts_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(5).then(({data,error}) => {
      if (!error && data) setLiveAds(data);
    });
  }, []);
  useEffect(() => {
    if (!supabase) return;
    supabase.rpc('get_professional_directory').then(({ data, error }) => {
      if (error) { setNotice('تعذر تحميل دليل الحرفيين. تحقق من الاتصال وحاول مجددًا.'); setDirectoryLoaded(true); return; }
      if (data) setLivePros(data.map((row: any) => {
        const categoryName = String(row.category || row.service_title || 'خدمات منزلية');
        const categoryIcon = /كهرب|electric/i.test(categoryName) ? Zap : /سباك|ماء|plumb/i.test(categoryName) ? Wrench : /دهان|paint/i.test(categoryName) ? Paintbrush : /نجار|wood/i.test(categoryName) ? Hammer : /تكييف|تبريد|air/i.test(categoryName) ? Snowflake : Home;
        const name = String(row.display_name || 'حرفي');
        return { id: row.service_id, professionalId: row.professional_id, serviceId: row.service_id, isVerified: Boolean(row.is_verified), name, job: String(row.service_title || categoryName), city: [row.wilaya, row.city].filter(Boolean).join(' — ') || 'الجزائر', wilaya: String(row.wilaya || ''), commune: String(row.city || ''), description: String(row.description || row.service_description || row.bio || ''), phone: String(row.phone || row.professional_phone || ''), rating: Number(row.average_rating || 0).toFixed(1), jobs: `${Number(row.completed_jobs || 0)} خدمة`, price: row.starting_price_dzd == null ? 'حسب طبيعة العمل' : `ابتداءً من ${Number(row.starting_price_dzd).toLocaleString('fr-DZ')} دج`, initials: name.slice(0, 1), color: 'mint', icon: categoryIcon };
      }));
      setDirectoryLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!supabase || !session?.user) { setMyRequests([]); setIncomingRequests([]); setProfileRole('customer'); return; }
    let cancelled = false;
    const loadAccountData = async () => {
      let { data: profile, error: profileError } = await supabase.from('profiles').select('role,display_name,professional_name,bio,phone,is_suspended').eq('id', session.user.id).maybeSingle();
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
          const refreshed = await supabase.from('profiles').select('role,display_name,professional_name,bio,phone,is_suspended').eq('id', session.user.id).maybeSingle();
          if (refreshed.error) throw refreshed.error;
          profile = refreshed.data;
        } catch (error) {
          setNotice(error instanceof Error ? `تعذر إعداد ملف الحساب: ${error.message}` : 'تعذر إعداد ملف الحساب.');
          return;
        }
      }
      if (cancelled) return;
      if (profile?.is_suspended) {
        await supabase.auth.signOut();
        if (!cancelled) { setSession(null); setNotice('تم إيقاف هذا الحساب من مالك التطبيق. تواصل مع الإدارة للمراجعة.'); }
        return;
      }
      const role = profile?.role || 'customer'; setProfileRole(role); setProfileName(profile?.display_name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'مستخدم سلكني'); setProfessionalNickname(profile?.professional_name || session.user.user_metadata?.professional_name || ''); setProfileBio(profile?.bio || ''); setProfilePhone(profile?.phone || '');
      const customerQuery = await supabase.from('service_requests').select('id,title,details,status,cancellation_reason,created_at,preferred_at,professional_id,service_id,reviews(id)').eq('customer_id', session.user.id).order('created_at', { ascending: false });
      if (customerQuery.error) { if (!cancelled) setNotice(`تعذر تحميل طلباتك: ${customerQuery.error.message}`); }
      else if (!cancelled) setMyRequests((customerQuery.data || []).map((r: any) => ({ ...r, has_review: Array.isArray(r.reviews) && r.reviews.length > 0 })));
      if (role === 'professional') {
        const incomingQuery = await supabase.from('service_requests').select('id,title,details,status,cancellation_reason,created_at,preferred_at,customer_id,service_id').eq('professional_id', session.user.id).order('created_at', { ascending: false });
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
    if (!supabase || !session?.user || !['owner','moderator'].includes(profileRole)) {
      setAdminReports([]); setAdminAuditLogs([]); setAdminUsers([]); setAdminServices([]);
      setAdminRequests([]); setAdminPayments([]); setAdminCategories([]); setAdminAds([]); return;
    }
    let cancelled = false;
    const loadAdmin = async () => {
      const [users, services, requests, reports, audit, payments, categoriesRows, adsRows, settingsRows] = await Promise.all([
        supabase.from('profiles').select('id,display_name,professional_name,phone,city,wilaya,bio,avatar_url,role,is_verified,subscription_active,subscription_ends_at,subscription_plan,is_suspended,suspension_reason,created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(200),
        supabase.from('professional_services').select('id,professional_id,title,category,description,wilaya,city,is_active,starting_price_dzd,created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('service_requests').select('id,customer_id,professional_id,title,details,status,cancellation_reason,created_at,preferred_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('reports').select('id,reason,status,created_at,reported_profile_id,request_id').in('status', ['open','reviewing']).order('created_at', { ascending: false }).limit(100),
        supabase.from('audit_logs').select('id,actor_id,action,entity_type,entity_id,details,created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('subscription_payments').select('id,user_id,account_type,plan_code,amount_dzd,transfer_reference,receipt_path,status,submitted_at,admin_note').order('submitted_at', { ascending: false }).limit(100),
        supabase.from('service_categories').select('id,name,icon,sort_order,is_active,created_at').order('sort_order', { ascending: true }),
        supabase.from('ads').select('id,title,body,image_url,target_url,starts_at,ends_at,is_active,created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('app_settings').select('key,value')
      ]);
      if (cancelled) return;
      const failedQuery = [users, services, requests, reports, audit, payments, categoriesRows, adsRows, settingsRows].find(result => result.error);
      if (failedQuery?.error) setNotice(`تعذر تحميل لوحة الإدارة: ${failedQuery.error.message}`);
      setAdminStats({ users: users.count || users.data?.length || 0, services: services.data?.length || 0, requests: requests.data?.length || 0, reports: reports.data?.length || 0 });
      setAdminUsers(users.data || []); setAdminServices(services.data || []); setAdminRequests(requests.data || []);
      setAdminReports(reports.data || []); setAdminAuditLogs(audit.data || []); setAdminPayments(payments.data || []);
      setAdminCategories(categoriesRows.data || []); setAdminAds(adsRows.data || []); setAdminSettings(Object.fromEntries((settingsRows.data || []).map((row:any)=>[row.key,row.value])));
    };
    void loadAdmin(); return () => { cancelled = true; };
  }, [session?.user?.id, profileRole, adminRefreshKey]);
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
  const adminAction = async (work: () => Promise<{ error: any }>, success: string) => {
    if (!supabase || profileRole !== 'owner') { setNotice('هذه العملية متاحة لمالك التطبيق فقط.'); return false; }
    setBusy(true); setNotice('');
    try { const result = await work(); if (result?.error) throw result.error; setNotice(success); setAdminRefreshKey(v => v + 1); return true; }
    catch (err) { setNotice(err instanceof Error ? err.message : 'تعذّر تنفيذ العملية الإدارية.'); return false; }
    finally { setBusy(false); }
  };
  const saveAdminUser = async (user: any, patch: Record<string, any>) => {
    if (!supabase || !session?.user || (user.id === session.user.id && patch.role)) return;
    await adminAction(async () => supabase!.from('profiles').update(patch).eq('id', user.id), 'تم تحديث حساب المستخدم.');
  };
  const openAdminUserEditor = (user: any) => { setAdminEditUser(user); setAdminEditDraft({ display_name:user.display_name||'', professional_name:user.professional_name||'', phone:user.phone||'', bio:user.bio||'', avatar_url:user.avatar_url||'', city:user.city||'', wilaya:user.wilaya||'', role:user.role||'customer', is_verified:!!user.is_verified, subscription_active:!!user.subscription_active, subscription_plan:user.subscription_plan||'monthly', subscription_ends_at:user.subscription_ends_at ? new Date(user.subscription_ends_at).toISOString().slice(0,10) : '', is_suspended:!!user.is_suspended, suspension_reason:user.suspension_reason||'' }); };
  const saveAdminUserFull = async (e: FormEvent) => { e.preventDefault(); if (!adminEditUser || !supabase) return; const d=adminEditDraft; const phone=String(d.phone||'').trim().replace(/[\s-]/g,''); if (d.role==='professional' && !phone) { setNotice('رقم الهاتف إلزامي لكل حساب حرفي.'); return; } if (d.role==='professional' && String(d.professional_name||'').trim().length<2) { setNotice('اسم الشهرة المهني إلزامي للحرفي.'); return; } if (d.role==='professional' && phone && !/^(([+]213|0)[0-9]{8,9})$/.test(phone)) { setNotice('أدخل رقم هاتف جزائري صحيحًا.'); return; } const patch={display_name:String(d.display_name||'').trim(),professional_name:d.role==='professional'?(String(d.professional_name||'').trim()||null):null,phone:phone||null,bio:String(d.bio||'').trim()||null,avatar_url:String(d.avatar_url||'').trim()||null,city:String(d.city||'').trim()||null,wilaya:String(d.wilaya||'').trim()||null,role:d.role,is_verified:!!d.is_verified,subscription_active:!!d.subscription_active,subscription_plan:d.subscription_plan,subscription_ends_at:d.subscription_ends_at?new Date(d.subscription_ends_at+'T23:59:59').toISOString():null,is_suspended:!!d.is_suspended,suspension_reason:d.is_suspended?(String(d.suspension_reason||'').trim()||'إيقاف من لوحة المالك'):null}; const saved=await adminAction(async()=>supabase!.from('profiles').update(patch).eq('id',adminEditUser.id),'تم حفظ جميع تعديلات الحساب.'); if(saved) setAdminEditUser(null); };
  const deleteAdminUser = async (user: any) => {
    if (!supabase || !window.confirm('هل تريد حذف هذا الحساب نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setBusy(true); setNotice('');
    try { const { error } = await supabase.rpc('owner_delete_account', { p_user_id: user.id }); if (error) throw error; setNotice('تم حذف الحساب.'); setAdminRefreshKey(v => v + 1); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'تعذّر حذف الحساب.'); }
    finally { setBusy(false); }
  };
  const reviewPayment = async (payment: any, approve: boolean) => {
    if (!supabase) return;
    await adminAction(async () => supabase!.rpc('review_subscription_payment', { p_payment_id: payment.id, p_approve: approve, p_admin_note: approve ? 'تمت الموافقة من لوحة المالك' : 'تم رفض طلب الاشتراك من لوحة المالك' }), approve ? 'تمت الموافقة على الاشتراك.' : 'تم رفض طلب الاشتراك.');
  };
  const createAdminCategory = async (e: FormEvent) => {
    e.preventDefault(); const name = categoryDraft.trim(); if (!supabase || name.length < 2) return;
    await adminAction(async () => supabase!.from('service_categories').insert({ name, sort_order: adminCategories.length }), 'تمت إضافة التصنيف.'); setCategoryDraft('');
  };
  const createAdminAd = async (e: FormEvent) => {
    e.preventDefault(); const title = adTitleDraft.trim(), body = adBodyDraft.trim(); if (!supabase || title.length < 2 || body.length < 2) return;
    await adminAction(async () => supabase!.from('ads').insert({ title, body, starts_at: adStartDraft ? new Date(adStartDraft).toISOString() : new Date().toISOString(), ends_at: adEndDraft ? new Date(adEndDraft).toISOString() : null, is_active: false }), 'تم حفظ الإعلان كمسودة.'); setAdTitleDraft(''); setAdBodyDraft(''); setAdStartDraft(''); setAdEndDraft('');
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

  const paymentAmount = (plan: string) => Number(paymentSettings[plan === 'pro_monthly' ? 'price_pro_monthly' : plan === 'pro_yearly' ? 'price_pro_yearly' : 'price_monthly'] || (plan === 'pro_monthly' ? 1500 : plan === 'pro_yearly' ? 13000 : 1000));
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    const loadPublicSettings = async () => {
      const { data, error } = await supabase.from('app_settings').select('key,value');
      if (cancelled || error || !data) return;
      const values = Object.fromEntries(data.map((row:any) => [row.key, row.value]));
      setPaymentSettings(current => ({ ...current, ...values }));
    };
    void loadPublicSettings();
    if (session?.user?.id) {
      void supabase.from('subscription_payments').select('id,plan_code,amount_dzd,transfer_reference,receipt_path,status,submitted_at,admin_note,subscription_ends_at').eq('user_id',session.user.id).order('submitted_at',{ascending:false}).limit(30).then(({data,error})=>{
        if (cancelled) return;
        if (error) setNotice('تعذر تحميل سجل الاشتراكات: '+error.message); else setMyPayments(data||[]);
      });
    } else setMyPayments([]);
    return () => { cancelled = true; };
  }, [session?.user?.id, adminRefreshKey]);
  useEffect(() => {
    if (!supabase || !session?.user?.id || profileRole !== 'professional') { setSupportMessages([]); return; }
    let cancelled = false;
    const load = async () => {
      const {data,error}=await supabase!.from('professional_support_messages').select('id,professional_id,sender_id,body,created_at,read_at').eq('professional_id',session.user.id).order('created_at',{ascending:true}).limit(300);
      if(cancelled)return;
      if(error) setNotice('تعذر تحميل محادثة المالك: '+error.message);
      else setSupportMessages(data||[]);
    };
    void load();
    const channel=supabase.channel('salakni-owner-support-'+session.user.id).on('postgres_changes',{event:'*',schema:'public',table:'professional_support_messages',filter:'professional_id=eq.'+session.user.id},()=>{void load();}).subscribe();
    return ()=>{cancelled=true;void supabase?.removeChannel(channel);};
  }, [session?.user?.id,profileRole]);
  useEffect(() => {
    if (!supabase || !session?.user?.id || profileRole !== 'owner') { setAdminSupportMessages([]); return; }
    let cancelled=false;
    const load=async()=>{
      const {data,error}=await supabase!.from('professional_support_messages').select('id,professional_id,sender_id,body,created_at,read_at').order('created_at',{ascending:true}).limit(1000);
      if(cancelled)return;
      if(error)setNotice('تعذر تحميل رسائل الحرفيين: '+error.message); else setAdminSupportMessages(data||[]);
    };
    void load();
    const channel=supabase.channel('salakni-owner-support-admin').on('postgres_changes',{event:'*',schema:'public',table:'professional_support_messages'},()=>{void load();}).subscribe();
    return ()=>{cancelled=true;void supabase?.removeChannel(channel);};
  }, [session?.user?.id,profileRole,adminRefreshKey]);
  const submitSubscriptionPayment = async (e: FormEvent) => {
    e.preventDefault();
    if(!supabase || !session?.user || !['customer','professional'].includes(profileRole)){setNotice('سجّل الدخول بحساب زبون أو حرفي لإرسال طلب الاشتراك.');return;}
    const reference=transferReference.trim();
    if(reference.length<4){setNotice('أدخل رقم العملية أو مرجع التحويل الصحيح.');return;}
    if(paymentMethod==='baridimob'&&!String(paymentSettings.baridimob_number||'').trim()){setNotice('لم يضبط المالك رقم بريدي موب بعد. لا ترسل أي تحويل حتى يظهر رقم رسمي داخل التطبيق.');return;}
    if(paymentMethod==='ccp'&&!String(paymentSettings.ccp_account||'').trim()){setNotice('لم يضبط المالك حساب CCP بعد. لا ترسل أي تحويل حتى يظهر الحساب الرسمي داخل التطبيق.');return;}
    if(!receiptFile){setNotice('أرفق صورة أو ملف PDF لإثبات الدفع.');return;}
    if(receiptFile.size>5*1024*1024){setNotice('حجم الإيصال يجب ألا يتجاوز 5 ميغابايت.');return;}
    if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(receiptFile.type)){setNotice('الأنواع المقبولة: JPG أو PNG أو WEBP أو PDF.');return;}
    if(myPayments.some(p=>p.status==='pending')){setNotice('لديك طلب دفع قيد المراجعة. انتظر قرار المالك قبل إرسال طلب جديد.');return;}
    setBusy(true);setNotice('');
    let uploadedPath='';
    try{
      const ext=receiptFile.type==='application/pdf'?'pdf':receiptFile.type==='image/png'?'png':receiptFile.type==='image/webp'?'webp':'jpg';
      uploadedPath=session.user.id+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext;
      const {error:uploadError}=await supabase.storage.from('subscription-receipts').upload(uploadedPath,receiptFile,{contentType:receiptFile.type,upsert:false});
      if(uploadError)throw uploadError;
      const amount=paymentAmount(paymentPlan);
      const {data,error}=await supabase.from('subscription_payments').insert({user_id:session.user.id,account_type:profileRole,plan_code:paymentPlan,amount_dzd:amount,transfer_reference:reference,receipt_path:uploadedPath,status:'pending'}).select('id,plan_code,amount_dzd,transfer_reference,receipt_path,status,submitted_at,admin_note,subscription_ends_at').single();
      if(error)throw error;
      setMyPayments(rows=>[data,...rows]);setTransferReference('');setReceiptFile(null);setAdminRefreshKey(v=>v+1);
      const fileInput=document.getElementById('subscription-receipt-file') as HTMLInputElement|null;if(fileInput)fileInput.value='';
      setNotice('تم إرسال إثبات الدفع بنجاح. سيبقى الاشتراك قيد الانتظار حتى يتحقق المالك من الإيصال والعملية.');
    }catch(err){
      if(uploadedPath) await supabase.storage.from('subscription-receipts').remove([uploadedPath]);
      setNotice(err instanceof Error?err.message:'تعذر إرسال إثبات الدفع. تحقق من الاتصال وحاول مجددًا.');
    }finally{setBusy(false);}
  };
  const sendProfessionalSupportMessage = async (e:FormEvent) => {
    e.preventDefault();const body=supportDraft.trim();
    if(!supabase||!session?.user||profileRole!=='professional'||body.length<1)return;
    setBusy(true);setNotice('');
    try{
      const {data,error}=await supabase.from('professional_support_messages').insert({professional_id:session.user.id,sender_id:session.user.id,body}).select('id,professional_id,sender_id,body,created_at,read_at').single();
      if(error)throw error;
      setSupportMessages(rows=>rows.some(m=>m.id===data.id)?rows:[...rows,data]);setSupportDraft('');
    }catch(err){setNotice(err instanceof Error?err.message:'تعذر إرسال الرسالة إلى المالك.');}finally{setBusy(false);}
  };
  const sendOwnerSupportMessage = async (e:FormEvent) => {
    e.preventDefault();const body=adminSupportDraft.trim();
    if(!supabase||!session?.user||profileRole!=='owner'||!selectedSupportProfessionalId||!body)return;
    setBusy(true);setNotice('');
    try{
      const {data,error}=await supabase.from('professional_support_messages').insert({professional_id:selectedSupportProfessionalId,sender_id:session.user.id,body}).select('id,professional_id,sender_id,body,created_at,read_at').single();
      if(error)throw error;
      setAdminSupportMessages(rows=>rows.some(m=>m.id===data.id)?rows:[...rows,data]);setAdminSupportDraft('');
    }catch(err){setNotice(err instanceof Error?err.message:'تعذر إرسال رد المالك.');}finally{setBusy(false);}
  };
  const openPaymentReceipt = async (payment:any) => {
    if(!supabase||!payment.receipt_path)return;
    const {data,error}=await supabase.storage.from('subscription-receipts').createSignedUrl(payment.receipt_path,120);
    if(error||!data?.signedUrl){setNotice('تعذر فتح الإيصال. تحقق من صلاحية الوصول إلى الملف.');return;}
    window.open(data.signedUrl,'_blank','noopener,noreferrer');
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
      const { data: current, error: currentError } = await supabase.from('profiles').select('role,phone,professional_name').eq('id', session.user.id).single();
      if (currentError) throw currentError;
      const patch: Record<string, any> = { display_name: name, bio: profileBio.trim() || null };
      if (current.role === 'professional') { const nickname = professionalNickname.trim(); if (nickname.length < 2 || nickname.length > 60) { setNotice('اسم الشهرة المهني إلزامي ويجب أن يكون بين حرفين و60 حرفًا.'); return; } patch.professional_name = nickname; }
      if (current.role === 'professional' && !String(current.phone || '').trim()) {
        const phone = profilePhone.trim();
        if (!/^(([+]213|0)[0-9]{8,9})$/.test(phone.replace(/[\s-]/g,''))) { setNotice('رقم الهاتف للحرفي إلزامي. أدخل رقمًا جزائريًا صحيحًا، ولا يمكن تغييره بعد حفظه.'); return; }
        patch.phone = phone.replace(/[\s-]/g,'');
      }
      const { error } = await supabase.from('profiles').update(patch).eq('id', session.user.id);
      if (error) throw error;
      if (patch.phone) setProfilePhone(String(patch.phone)); setNotice(patch.phone ? 'تم تثبيت رقم هاتفك المهني ولا يمكن تغييره من الحساب.' : 'تم حفظ بيانات حسابك.');
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
    const metadataPhone = String(user.user_metadata?.phone || '').trim();
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: displayName.length >= 2 ? displayName : 'مستخدم سلكني',
      role,
      ...(role === 'professional' && metadataPhone ? { phone: metadataPhone, ...(professionalName ? { professional_name: professionalName } : {}) } : {})
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
        const normalizedPhone = authPhone.trim().replace(/[\s-]/g,'');
        if (accountType === 'professional' && authProfessionalName.trim().length < 2) { setNotice('اسم الشهرة المهني إلزامي، مثل: محمد للكهرباء.'); return; }
        if (accountType === 'professional' && !/^(([+]213|0)[0-9]{8,9})$/.test(normalizedPhone)) { setNotice('رقم الهاتف إلزامي للحرفي. أدخل رقمًا جزائريًا صحيحًا مثل 0550123456.'); return; }
        const { data, error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword, options: { data: { display_name: authName.trim(), account_type: accountType, ...(accountType === 'professional' ? { phone: normalizedPhone, professional_name: authProfessionalName.trim() } : {}) } } });
        if (error) throw error;
        if (data.session && data.user) await ensureProfile(data.user, authName.trim());
        setNotice(data.session ? 'تم إنشاء الحساب وتسجيل الدخول.' : 'تم إنشاء الحساب. تحقق من بريدك إن كان تأكيد البريد مفعّلًا، ثم سجّل الدخول.');
        if (data.session) setAuthOpen(false); else setAuthMode('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        if (data.user) {
          await ensureProfile(data.user, data.user.user_metadata?.display_name || 'مستخدم سلكني');
          const { data: accountProfile, error: accountError } = await supabase.from('profiles').select('is_suspended').eq('id', data.user.id).maybeSingle();
          if (accountError) throw accountError;
          if (accountProfile?.is_suspended) { await supabase.auth.signOut(); throw new Error('تم إيقاف هذا الحساب من مالك التطبيق. تواصل مع الإدارة للمراجعة.'); }
        }
        setAuthOpen(false); setNotice('');
      }
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر إكمال العملية. تحقق من البيانات وحاول مجددًا.'); }
    finally { setBusy(false); }
  };
  const submitProfessionalService = async (e: FormEvent) => {
    e.preventDefault(); setNotice('');
    if (!supabase || !session?.user) { setAuthOpen(true); return; }
    const { data: professionalProfile, error: phoneCheckError } = await supabase.from('profiles').select('phone').eq('id', session.user.id).single();
    if (phoneCheckError) { setNotice('تعذر التحقق من رقم الهاتف. حاول مجددًا.'); return; }
    if (!String(professionalProfile?.phone || '').trim()) { setNotice('يجب تثبيت رقم هاتفك في قسم «حسابي» قبل نشر الخدمة.'); setActiveTab('حسابي'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from('professional_services').insert({ professional_id: session.user.id, title: serviceTitle.trim(), category: serviceCategory, description: serviceDescription.trim() || null, wilaya: serviceWilaya.trim(), city: serviceCity.trim(), starting_price_dzd: servicePrice.trim() ? Number(servicePrice) : null, is_active: false });
      if (error) throw error;
      setNotice('تم إرسال الخدمة للمراجعة. ستظهر في دليل سلكني بعد موافقة مالك التطبيق وتفعيل الاشتراك.'); setServiceTitle(''); setServiceDescription(''); setServiceCity(''); setServicePrice('');
      const { data, error: directoryError } = await supabase.rpc('get_professional_directory');
      if (directoryError) throw directoryError;
      if (data) setLivePros(data.map((row: any) => { const categoryName = String(row.category || row.service_title || 'خدمات منزلية'); const categoryIcon = /كهرب|electric/i.test(categoryName) ? Zap : /سباك|ماء|plumb/i.test(categoryName) ? Wrench : /دهان|paint/i.test(categoryName) ? Paintbrush : /نجار|wood/i.test(categoryName) ? Hammer : /تكييف|تبريد|air/i.test(categoryName) ? Snowflake : Home; const name = String(row.display_name || 'حرفي'); return { id: row.service_id, professionalId: row.professional_id, serviceId: row.service_id, isVerified: Boolean(row.is_verified), name, job: String(row.service_title || categoryName), city: [row.wilaya, row.city].filter(Boolean).join(' — ') || 'الجزائر', wilaya: String(row.wilaya || ''), commune: String(row.city || ''), description: String(row.description || row.service_description || row.bio || ''), phone: String(row.phone || row.professional_phone || ''), rating: Number(row.average_rating || 0).toFixed(1), jobs: `${Number(row.completed_jobs || 0)} خدمة`, price: row.starting_price_dzd == null ? 'حسب طبيعة العمل' : `ابتداءً من ${Number(row.starting_price_dzd).toLocaleString('fr-DZ')} دج`, initials: name.slice(0, 1), color: 'mint', icon: categoryIcon }; }));
      setDirectoryLoaded(true);
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر نشر الخدمة.'); } finally { setBusy(false); }
  };
  const openProfessionalChat = async (p: Pro) => {
    if (!supabase || !session?.user) {
      setProfilePro(null); setAuthMode('login'); setAuthOpen(true);
      setNotice('سجّل الدخول أولًا لمراسلة الحرفي مباشرة.');
      return;
    }
    if (!p.professionalId) { setNotice('هذا ملف تجريبي؛ المراسلة المباشرة متاحة للملفات المسجلة فقط.'); return; }
    if (p.professionalId === session.user.id) { setNotice('هذا ملفك المهني.'); return; }
    setBusy(true); setNotice('');
    try {
      const { data: existing, error: lookupError } = await supabase.from('conversations').select('id,customer_id,professional_id,created_at').eq('customer_id', session.user.id).eq('professional_id', p.professionalId).maybeSingle();
      if (lookupError) throw lookupError;
      let conversation = existing;
      if (!conversation) {
        const { data, error } = await supabase.from('conversations').insert({ customer_id: session.user.id, professional_id: p.professionalId }).select('id,customer_id,professional_id,created_at').single();
        if (error) throw error;
        conversation = data;
      }
      const { data: chats, error: chatsError } = await supabase.from('conversations').select('id,customer_id,professional_id,created_at').or(`customer_id.eq.${session.user.id},professional_id.eq.${session.user.id}`).order('created_at', { ascending: false });
      if (chatsError) throw chatsError;
      setConversations(chats || []);
      setActiveConversationId(conversation.id);
      setMessagesView('chats'); setActiveTab('الرسائل'); setProfilePro(null);
    } catch (err) {
      setNotice(err instanceof Error ? `تعذّر فتح المحادثة: ${err.message}` : 'تعذّر فتح المحادثة المباشرة.');
    } finally { setBusy(false); }
  };

  const submitRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestPro) return;
    if (!supabase || !session?.user) { setRequestPro(null); setAuthMode('login'); setAuthOpen(true); setNotice('سجّل الدخول أولًا حتى نحفظ طلب الخدمة.'); return; }
    if (requestDate && new Date(requestDate).getTime() < Date.now() + 48 * 60 * 60 * 1000) { setNotice('يجب أن يكون موعد الحجز بعد يومين على الأقل. للأعمال العاجلة اترك الموعد فارغًا وتواصل مباشرةً مع الحرفي.'); return; }
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
  const updateRequestStatus = async (requestId: string, status: 'accepted'|'in_progress'|'completed'|'cancelled', cancellationReason?: string): Promise<boolean> => {
    if (!supabase || !session?.user) return false;
    if (status === 'cancelled' && String(cancellationReason || '').trim().length < 5) { setNotice('سبب الإلغاء مطلوب، اكتب خمسة أحرف على الأقل.'); return false; }
    setBusy(true); setNotice('');
    try {
      const patch: Record<string, any> = { status };
      if (status === 'cancelled') patch.cancellation_reason = cancellationReason!.trim();
      const { error } = await supabase.from('service_requests').update(patch).eq('id', requestId);
      if (error) throw error;
      setIncomingRequests(rows => rows.map(r => r.id === requestId ? { ...r, status, ...(status === 'cancelled' ? { cancellation_reason: cancellationReason!.trim() } : {}) } : r));
      setMyRequests(rows => rows.map(r => r.id === requestId ? { ...r, status, ...(status === 'cancelled' ? { cancellation_reason: cancellationReason!.trim() } : {}) } : r));
      setNotice('تم تحديث حالة الطلب.');
      return true;
    } catch (err) { setNotice(err instanceof Error ? err.message : 'تعذر تحديث الطلب.'); return false; }
    finally { setBusy(false); }
  };
  const submitCancellation = async (e: FormEvent) => {
    e.preventDefault();
    if (!cancelRequestTarget) return;
    const reason = cancelReasonDraft.trim();
    if (reason.length < 5) { setNotice('سبب الإلغاء مطلوب، اكتب خمسة أحرف على الأقل.'); return; }
    const ok = await updateRequestStatus(cancelRequestTarget.id, 'cancelled', reason);
    if (ok) { setCancelRequestTarget(null); setCancelReasonDraft(''); }
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
    (city === 'كل الولايات' || (p.wilaya || p.city).includes(city)) &&
    (!selectedCommune.trim() || (p.commune || p.city).toLocaleLowerCase('ar').includes(selectedCommune.trim().toLocaleLowerCase('ar'))) &&
    `${p.name} ${p.job} ${p.city}`.toLocaleLowerCase('ar').includes(query.trim().toLocaleLowerCase('ar'))
  ), [sourcePros, query, category, city, selectedCommune]);
  const visiblePros = activeTab === 'المفضلة' ? filtered.filter(p => favorites.includes(p.name)) : filtered;
  const toggleFavorite = (name: string) => setFavorites(old => old.includes(name) ? old.filter(x => x !== name) : [...old, name]);

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Wrench size={23}/></div><div><strong>سلكني</strong><span>خدماتك أقرب مما تتخيل</span></div></div>
      <button className={`location-pill ${locationOpen ? 'location-pill-open' : ''}`} onClick={() => setLocationOpen(open=>!open)} aria-expanded={locationOpen}><MapPin size={16}/><span>{city === 'كل الولايات' ? 'حدّد موقعك' : city}{selectedCommune.trim() ? ` · ${selectedCommune.trim()}` : ''}</span><ChevronLeft size={15}/></button>
    </header>
    {locationOpen && <section className="location-panel" aria-label="اختيار موقع البحث"><div className="location-panel-head"><div className="location-panel-icon"><MapPinned size={21}/></div><div><b>اعثر على حرفيين بالقرب منك</b><small>اختر ولايتك وبلديتك أو استخدم موقعك الحالي</small></div><button className="location-panel-close" aria-label="إغلاق اختيار الموقع" onClick={()=>setLocationOpen(false)}><X size={18}/></button></div><button className="use-current-location" disabled={locating} onClick={()=>{if(!navigator.geolocation){setLocationStatus('متصفحك لا يدعم تحديد الموقع. اختر الولاية يدويًا.');return;}setLocating(true);setLocationStatus('جارٍ تحديد موقعك…');navigator.geolocation.getCurrentPosition(async position=>{const lat=position.coords.latitude,lon=position.coords.longitude;setCurrentCoords({lat,lon});try{const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ar`);if(!response.ok)throw new Error('reverse geocoding unavailable');const data=await response.json();const address=data.address||{};const detectedWilaya=String(address.state||address.province||address.region||'');const detectedCommune=String(address.city||address.town||address.village||address.municipality||address.suburb||'');const matchedWilaya=algeriaWilayas.find(w=>w!=='كل الولايات'&&(detectedWilaya.includes(w)||w.includes(detectedWilaya)));if(matchedWilaya)setCity(matchedWilaya);if(detectedCommune)setSelectedCommune(detectedCommune);setLocationStatus(`تم تحديد موقعك التقريبي: ${[detectedWilaya,detectedCommune].filter(Boolean).join('، ')||'تم الحصول على الإحداثيات'}`);}catch{setLocationStatus('تم تحديد إحداثيات موقعك، لكن تعذّر تحويلها إلى اسم ولاية وبلدية. اخترهما يدويًا إن لزم.');}finally{setLocating(false);}},error=>{setLocating(false);setLocationStatus(error.code===1?'لم تسمح بإذن الموقع. يمكنك اختيار الولاية والبلدية يدويًا.':'تعذّر تحديد الموقع الآن. تأكد من تفعيل GPS ثم حاول مجددًا.');},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});}}><LocateFixed size={18}/>{locating?'جارٍ تحديد الموقع…':'استخدم موقعي الحالي'}<Navigation size={15}/></button><div className="location-select-grid"><label>الولاية<select value={city} onChange={e=>{setCity(e.target.value);setLocationStatus('');}}>{algeriaWilayas.map(w=><option key={w} value={w}>{w}</option>)}</select></label><label>البلدية<input value={selectedCommune} onChange={e=>setSelectedCommune(e.target.value)} placeholder="اكتب اسم البلدية (اختياري)"/></label></div>{locationStatus && <p className="location-status" role="status">{locationStatus}</p>}{currentCoords && <a className="location-map-link" href={`https://www.openstreetmap.org/?mlat=${currentCoords.lat}&mlon=${currentCoords.lon}#map=15/${currentCoords.lat}/${currentCoords.lon}`} target="_blank" rel="noreferrer"><MapPinned size={15}/> عرض موقعي على الخريطة <ChevronLeft size={15}/></a>}<div className="location-panel-footer"><span><ShieldCheck size={14}/> لا يتم تحديد الموقع إلا بعد ضغطك على الزر</span><button onClick={()=>{setCity('كل الولايات');setSelectedCommune('');setCurrentCoords(null);setLocationStatus('');}}>مسح التحديد</button></div><button className="apply-location-button" onClick={()=>{setLocationOpen(false);document.getElementById('professionals')?.scrollIntoView({behavior:'smooth'});}}>عرض الحرفيين في هذا الموقع <ChevronLeft size={16}/></button></section>}
    <main>
      {adminEditUser && profileRole==='owner' && <div className="modal-backdrop" onClick={()=>setAdminEditUser(null)}><section className="modal-card admin-user-editor" onClick={e=>e.stopPropagation()}><div className="section-heading"><div><span className="section-kicker">صلاحيات المالك</span><h2>تعديل كامل للحساب</h2></div><button type="button" className="secondary-action" onClick={()=>setAdminEditUser(null)}>إغلاق</button></div><p>يمكنك تعديل رقم الهاتف وجميع بيانات الملف والاشتراك وحالة الحساب. هذه التعديلات الإدارية تتجاوز قفل رقم الهاتف المخصص للحرفي.</p><form className="admin-create-form" onSubmit={saveAdminUserFull}><label>الاسم الظاهر<input required minLength={2} maxLength={100} value={adminEditDraft.display_name||''} onChange={e=>setAdminEditDraft(d=>({...d,display_name:e.target.value}))}/></label><label>اسم الشهرة المهني<input value={adminEditDraft.professional_name||''} onChange={e=>setAdminEditDraft(d=>({...d,professional_name:e.target.value}))} placeholder="مثال: محمد للكهرباء"/></label><label>رقم الهاتف<input type="tel" inputMode="tel" value={adminEditDraft.phone||''} onChange={e=>setAdminEditDraft(d=>({...d,phone:e.target.value}))} placeholder="0550123456"/></label><label>الولاية<input value={adminEditDraft.wilaya||''} onChange={e=>setAdminEditDraft(d=>({...d,wilaya:e.target.value}))}/></label><label>البلدية<input value={adminEditDraft.city||''} onChange={e=>setAdminEditDraft(d=>({...d,city:e.target.value}))}/></label><label>النبذة<textarea rows={3} maxLength={2000} value={adminEditDraft.bio||''} onChange={e=>setAdminEditDraft(d=>({...d,bio:e.target.value}))}/></label><label>رابط صورة الملف<input type="url" value={adminEditDraft.avatar_url||''} onChange={e=>setAdminEditDraft(d=>({...d,avatar_url:e.target.value}))} placeholder="https://…"/></label><label>نوع الحساب<select value={adminEditDraft.role} onChange={e=>setAdminEditDraft(d=>({...d,role:e.target.value}))}><option value="customer">زبون</option><option value="professional">حرفي</option><option value="moderator">مشرف</option><option value="owner">مالك</option></select></label><label>التوثيق<select value={adminEditDraft.is_verified?'yes':'no'} onChange={e=>setAdminEditDraft(d=>({...d,is_verified:e.target.value==='yes'}))}><option value="no">غير موثق</option><option value="yes">موثق</option></select></label><label>الاشتراك<select value={adminEditDraft.subscription_active?'active':'inactive'} onChange={e=>setAdminEditDraft(d=>({...d,subscription_active:e.target.value==='active'}))}><option value="inactive">غير نشط</option><option value="active">نشط</option></select></label><label>خطة الاشتراك<select value={adminEditDraft.subscription_plan} onChange={e=>setAdminEditDraft(d=>({...d,subscription_plan:e.target.value}))}><option value="monthly">عادي شهري</option><option value="pro_monthly">Pro شهري</option><option value="pro_yearly">Pro سنوي</option></select></label><label>تاريخ انتهاء الاشتراك<input type="date" value={adminEditDraft.subscription_ends_at||''} onChange={e=>setAdminEditDraft(d=>({...d,subscription_ends_at:e.target.value}))}/></label><label>حالة الحساب<select value={adminEditDraft.is_suspended?'suspended':'active'} onChange={e=>setAdminEditDraft(d=>({...d,is_suspended:e.target.value==='suspended'}))}><option value="active">نشط</option><option value="suspended">موقوف</option></select></label><label>سبب الإيقاف<input value={adminEditDraft.suspension_reason||''} onChange={e=>setAdminEditDraft(d=>({...d,suspension_reason:e.target.value}))}/></label><button className="modal-submit" type="submit" disabled={busy}>حفظ جميع التعديلات</button></form></section></div>}{activeTab === 'الرسائل' ? <section className="section tab-page"><div className="section-heading"><div><span className="section-kicker">إدارة الطلبات</span><h2>{messagesView === 'chats' ? 'المحادثات الخاصة' : (profileRole === 'professional' ? 'طلبات الزبائن' : 'طلباتي للخدمات')}</h2></div>{session && <span className="verified">متصل</span>}</div>{session && <div className="message-view-switch"><button className={messagesView==='requests'?'chosen':''} onClick={()=>setMessagesView('requests')}>الطلبات</button><button className={messagesView==='chats'?'chosen':''} onClick={()=>setMessagesView('chats')}>المحادثات <span>{conversations.length}</span></button>{profileRole==='professional'&&<button className={messagesView==='support'?'chosen':''} onClick={()=>setMessagesView('support')}>مراسلة المالك</button>}</div>}{!session ? <div className="empty-state"><MessageCircle size={30}/><b>سجّل الدخول لمتابعة طلباتك</b><span>تُحفظ طلبات الخدمة في حسابك.</span><button onClick={()=>{setAuthMode('login');setAuthOpen(true)}}>تسجيل الدخول</button></div> : messagesView === 'support' && profileRole==='professional' ? <div className="support-chat-card"><div className="support-chat-header"><span className="support-emblem"><ShieldCheck size={22}/></span><div><b>مركز التواصل مع مالك سلكني</b><small>للاشتراكات، مراجعة الحساب، المشاكل التقنية والاقتراحات</small></div></div><div className="support-message-list">{supportMessages.length?supportMessages.map(m=><div key={m.id} className={m.sender_id===session.user.id?'chat-bubble mine':'chat-bubble'}><p>{m.body}</p><small>{m.sender_id===session.user.id?'أنت':'إدارة سلكني'} · {new Date(m.created_at).toLocaleString('ar-DZ',{dateStyle:'short',timeStyle:'short'})}</small></div>):<div className="chat-empty">اكتب رسالتك الأولى، وستصل مباشرةً إلى مالك التطبيق.</div>}</div><form className="chat-compose" onSubmit={sendProfessionalSupportMessage}><input value={supportDraft} onChange={e=>setSupportDraft(e.target.value)} maxLength={5000} placeholder="اكتب رسالتك إلى المالك…" aria-label="رسالة إلى المالك"/><button disabled={busy||!supportDraft.trim()} type="submit" aria-label="إرسال الرسالة"><Send size={18}/></button></form></div> : messagesView === 'chats' ? <div className="chat-layout">{conversations.length ? <><div className="conversation-list">{conversations.map(c=><button key={c.id} className={activeConversationId===c.id?'conversation-item selected':'conversation-item'} onClick={()=>setActiveConversationId(c.id)}><span className="conversation-avatar"><MessageCircle size={17}/></span><span><b>{c.customer_id===session.user.id?'محادثة مع الحرفي':'محادثة مع الزبون'}</b><small>{new Date(c.created_at).toLocaleDateString('ar-DZ')}</small></span><ChevronLeft size={16}/></button>)}</div><div className="chat-panel"><div className="chat-message-list">{chatMessages.length ? chatMessages.map(m=><div key={m.id} className={m.sender_id===session.user.id?'chat-bubble mine':'chat-bubble'}><p>{m.body}</p><small>{new Date(m.created_at).toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}</small></div>) : <div className="chat-empty">ابدأ المحادثة برسالة واضحة ومحترمة.</div>}</div><form className="chat-compose" onSubmit={sendChatMessage}><input value={messageDraft} onChange={e=>setMessageDraft(e.target.value)} maxLength={5000} placeholder="اكتب رسالتك…" aria-label="نص الرسالة"/><button disabled={busy || !messageDraft.trim()} type="submit" aria-label="إرسال"><Send size={18}/></button></form></div></> : <div className="empty-state"><MessageCircle size={30}/><b>لا توجد محادثات بعد</b><span>أرسل طلب خدمة لحرفي، وستنشأ محادثة خاصة تلقائيًا.</span><button onClick={()=>setActiveTab('الرئيسية')}>اكتشف الحرفيين</button></div>}</div> : (profileRole === 'professional' ? incomingRequests : myRequests).length ? <div className="request-list">{(profileRole === 'professional' ? incomingRequests : myRequests).map(r=><article className="request-card" key={r.id}><div><b>{r.title}</b><span className="request-status">{({pending:'بانتظار الرد',accepted:'تم القبول',in_progress:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغى'} as Record<string,string>)[r.status] || r.status}</span></div><p>{r.details || 'لم يضف الزبون تفاصيل.'}</p><small>تاريخ الطلب: {new Date(r.created_at).toLocaleDateString('ar-DZ')}{r.preferred_at ? ` · الموعد المطلوب: ${new Date(r.preferred_at).toLocaleString('ar-DZ')}` : ' · تواصل مباشر دون موعد محجوز'}{r.cancellation_reason ? ` · سبب الإلغاء: ${r.cancellation_reason}` : ''}</small>{profileRole === 'professional' && <div className="request-actions">{r.status === 'pending' && <><button disabled={busy} onClick={()=>void updateRequestStatus(r.id,'accepted')}>قبول الطلب</button><button className="secondary-action" disabled={busy} onClick={()=>void updateRequestStatus(r.id,'cancelled')}>رفض / إلغاء</button></>}{r.status === 'accepted' && <button disabled={busy} onClick={()=>void updateRequestStatus(r.id,'in_progress')}>بدء العمل</button>}{r.status === 'in_progress' && <button disabled={busy} onClick={()=>void updateRequestStatus(r.id,'completed')}>إنهاء الخدمة</button>}</div>}{profileRole === 'customer' && !['completed','cancelled'].includes(r.status) && <button className="secondary-action" disabled={busy} onClick={()=>{setCancelRequestTarget(r);setCancelReasonDraft('')}}>إلغاء الطلب</button>}{profileRole === 'customer' && r.status === 'completed' && !r.has_review && <button className="review-action" onClick={()=>{setReviewRequest(r);setReviewRating(5);setReviewComment('')}}><Star size={15}/> قيّم الخدمة</button>}</article>)}</div> : <div className="empty-state"><MessageCircle size={30}/><b>لا توجد طلبات بعد</b><span>{profileRole === 'professional' ? 'عندما يطلب زبون خدمتك سيظهر طلبه هنا.' : 'اختر حرفيًا منشورًا وأرسل أول طلب خدمة.'}</span><button onClick={()=>setActiveTab('الرئيسية')}>اكتشف الحرفيين</button></div>}</section> : activeTab === 'حسابي' ? <section className="section tab-page"><div className="section-heading"><div><span className="section-kicker">مرحبًا بك</span><h2>حسابك في سلكني</h2></div></div><div className="account-card"><div className="account-avatar"><UserRound size={30}/></div><h3>{session ? (profileRole==='professional' ? (professionalNickname || profileName || session.user.email) : (profileName || session.user.email)) : 'زائر سلكني'}</h3><p>{session ? 'حسابك متصل ويمكنك متابعة طلباتك ومفضلاتك.' : 'سجّل الدخول لحفظ طلباتك والتواصل مع الحرفيين.'}</p>{session ? <button onClick={async()=>{await supabase?.auth.signOut();setSession(null);setNotice('تم تسجيل الخروج.')}}><LogOut size={16}/> تسجيل الخروج</button> : <button onClick={()=>{setAuthMode('login');setAuthOpen(true)}}>تسجيل الدخول / إنشاء حساب</button>}</div>{session && <div className="professional-form-card"><span className="section-kicker">ملفك الشخصي</span><h3>تعديل بيانات الحساب</h3><form onSubmit={saveProfile}><label>الاسم الظاهر<input required minLength={2} maxLength={60} value={profileName} onChange={e=>setProfileName(e.target.value)}/></label>{profileRole==='professional' && <><label>اسم الشهرة المهني<input required minLength={2} maxLength={60} value={professionalNickname} onChange={e=>setProfessionalNickname(e.target.value)} placeholder="مثال: محمد للكهرباء"/><small className="phone-field-hint">سيظهر للزبائن بدل اسم المستخدم في البحث والملف المهني.</small></label><label>رقم الهاتف المهني <span className="required-phone-mark">{profilePhone.trim()?'رقم مثبت':'مطلوب لإكمال ملفك'}</span><input required={!profilePhone.trim()} type="tel" inputMode="tel" autoComplete="tel" maxLength={16} value={profilePhone} readOnly={Boolean(profilePhone.trim())} onChange={e=>setProfilePhone(e.target.value)} placeholder="0550123456"/><small className="phone-field-hint">{profilePhone.trim()?'هذا الرقم ثابت ولا يمكن تعديله من حسابك.':'أدخل رقمًا جزائريًا؛ بعد حفظه لن تتمكن من تغييره.'}</small></label></>}<label>نبذة قصيرة<textarea rows={3} maxLength={1000} value={profileBio} onChange={e=>setProfileBio(e.target.value)} placeholder="اكتب نبذة مختصرة عنك (اختياري)"/></label><button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ الحفظ…':'حفظ البيانات'}</button></form></div>}{session && ['customer','professional'].includes(profileRole) && <div className="subscription-center"><div className="subscription-heading"><span className="subscription-crown">✦</span><div><span className="section-kicker">SALAKNI MEMBERSHIP</span><h3>الاشتراك والدفع الآمن</h3><p>الدفع عبر بريد الجزائر أو بريدي موب، والتفعيل بعد مراجعة إثبات الدفع من المالك.</p></div></div><div className="subscription-plan-grid"><label className={paymentPlan==='monthly'?'subscription-plan selected':'subscription-plan'}><input type="radio" name="subscription-plan" value="monthly" checked={paymentPlan==='monthly'} onChange={()=>setPaymentPlan('monthly')}/><span>الاشتراك العادي</span><b>{paymentAmount('monthly').toLocaleString('fr-DZ')} دج</b><small>شهر واحد</small></label>{profileRole==='professional'&&<><label className={paymentPlan==='pro_monthly'?'subscription-plan selected':'subscription-plan'}><input type="radio" name="subscription-plan" value="pro_monthly" checked={paymentPlan==='pro_monthly'} onChange={()=>setPaymentPlan('pro_monthly')}/><span>PRO شهري</span><b>{paymentAmount('pro_monthly').toLocaleString('fr-DZ')} دج</b><small>أولوية في نتائج البحث</small></label><label className={paymentPlan==='pro_yearly'?'subscription-plan selected':'subscription-plan'}><input type="radio" name="subscription-plan" value="pro_yearly" checked={paymentPlan==='pro_yearly'} onChange={()=>setPaymentPlan('pro_yearly')}/><span>PRO سنوي</span><b>{paymentAmount('pro_yearly').toLocaleString('fr-DZ')} دج</b><small>سنة كاملة · أولوية PRO</small></label></>}</div><div className="payment-method-grid"><button type="button" className={paymentMethod==='baridimob'?'payment-method selected':'payment-method'} onClick={()=>setPaymentMethod('baridimob')}><span className="payment-method-icon">BM</span><span><b>بريدي موب</b><small>تحويل عبر التطبيق الرسمي</small></span></button><button type="button" className={paymentMethod==='ccp'?'payment-method selected':'payment-method'} onClick={()=>setPaymentMethod('ccp')}><span className="payment-method-icon">CCP</span><span><b>بريد الجزائر / CCP</b><small>حساب بريدي جاري</small></span></button></div><div className="payment-destination"><span className="payment-live-dot"/><b>{paymentMethod==='baridimob'?'بيانات بريدي موب':'بيانات حساب بريد الجزائر'}</b>{paymentMethod==='baridimob'?<><p>رقم الحساب/الهاتف: <strong>{String(paymentSettings.baridimob_number||'').trim()||'لم يضبطه المالك بعد'}</strong></p><p>اسم المستفيد: <strong>{String(paymentSettings.baridimob_account_name||'').trim()||'—'}</strong></p></>:<><p>رقم CCP: <strong>{String(paymentSettings.ccp_account||'').trim()||'لم يضبطه المالك بعد'}</strong></p><p>اسم صاحب الحساب: <strong>{String(paymentSettings.ccp_account_name||'').trim()||'—'}</strong></p></>}<small>{String(paymentSettings.payment_instructions||'حوّل المبلغ الصحيح، ثم أرفق إثبات الدفع.').trim()}</small></div><form className="subscription-payment-form" onSubmit={submitSubscriptionPayment}><label>رقم العملية / مرجع التحويل<input required minLength={4} maxLength={120} value={transferReference} onChange={e=>setTransferReference(e.target.value)} placeholder="أدخل مرجع العملية كما يظهر في الإيصال"/></label><label>إثبات الدفع <small>صورة JPG/PNG/WEBP أو PDF · بحد أقصى 5 ميغابايت</small><input id="subscription-receipt-file" required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setReceiptFile(e.target.files?.[0]||null)}/></label><div className="payment-total-row"><span>المبلغ المطلوب</span><b>{paymentAmount(paymentPlan).toLocaleString('fr-DZ')} دج</b></div><button className="modal-submit" disabled={busy||myPayments.some(p=>p.status==='pending')} type="submit">{busy?'جارٍ إرسال إثبات الدفع…':myPayments.some(p=>p.status==='pending')?'لديك طلب قيد المراجعة':'إرسال إثبات الدفع وطلب التفعيل'} <ChevronLeft size={17}/></button></form><div className="subscription-history"><h4>سجل اشتراكاتك</h4>{myPayments.length?myPayments.map(p=><article className="subscription-history-item" key={p.id}><div><b>{p.plan_code==='pro_yearly'?'PRO سنوي':p.plan_code==='pro_monthly'?'PRO شهري':'عادي شهري'}</b><small>{Number(p.amount_dzd).toLocaleString('fr-DZ')} دج · {new Date(p.submitted_at).toLocaleDateString('ar-DZ')}</small></div><span className={'payment-status '+p.status}>{p.status==='approved'?'مقبول':p.status==='rejected'?'مرفوض':'قيد المراجعة'}</span>{p.admin_note&&<p>{p.admin_note}</p>}</article>):<p>لم ترسل طلب اشتراك بعد.</p>}</div></div>}{session && (profileRole === 'owner' || profileRole === 'moderator') && <div className={profileRole === 'owner' ? 'admin-dashboard owner-command-center' : 'admin-dashboard'}>
  <div className="owner-console-header"><div className="owner-emblem"><Wrench size={25}/></div><div className="owner-console-title"><span>{profileRole === 'owner' ? 'SALAKNI • OWNER CONTROL' : 'SALAKNI • MODERATION'}</span><h3>{profileRole === 'owner' ? 'مركز قيادة سلكني' : 'مركز الإشراف'}</h3><p>{profileRole === 'owner' ? 'تحكّم كامل في المنصة من مكان واحد' : 'متابعة المحتوى والبلاغات'}</p></div><span className="owner-live-pill"><i/> {profileRole === 'owner' ? 'وضع المالك' : 'مشرف'}</span></div>
  <div className="admin-stat-grid"><div><b>{adminStats.users}</b><span>حسابات</span></div><div><b>{adminStats.services}</b><span>خدمات</span></div><div><b>{adminStats.requests}</b><span>طلبات</span></div><div><b>{adminStats.reports}</b><span>بلاغات مفتوحة</span></div></div>
  <div className="admin-nav">{[{id:'overview',label:'نظرة عامة'},{id:'users',label:'الحسابات'},{id:'services',label:'الخدمات'},{id:'requests',label:'الطلبات'},{id:'payments',label:'الاشتراكات'},{id:'support',label:'رسائل الحرفيين'},{id:'categories',label:'التصنيفات'},{id:'ads',label:'الإعلانات'},{id:'reports',label:'البلاغات'},{id:'audit',label:'سجل التدقيق'},{id:'settings',label:'إعدادات التطبيق'}].map(item=><button key={item.id} className={adminSection===item.id?'admin-nav-active':''} onClick={()=>setAdminSection(item.id)}>{item.label}</button>)}</div>
  {profileRole === 'moderator' && <p className="admin-note">إدارة الحسابات والاشتراكات والتصنيفات والإعلانات متاحة لمالك التطبيق فقط.</p>}
  {adminSection === 'overview' && <div><h4>ملخص التشغيل</h4><p>الحسابات: {adminStats.users} · الخدمات: {adminStats.services} · الطلبات: {adminStats.requests} · البلاغات: {adminStats.reports}</p><button disabled={busy} onClick={()=>setAdminRefreshKey(v=>v+1)}>تحديث البيانات</button><h4>طلبات الاشتراك المعلقة</h4>{adminPayments.filter(p=>p.status==='pending').slice(0,5).map(p=><article className="request-card" key={p.id}><b>{p.plan_code} — {Number(p.amount_dzd).toLocaleString('fr-DZ')} دج</b><small>مرجع التحويل: {p.transfer_reference}</small></article>)}{!adminPayments.some(p=>p.status==='pending')&&<p>لا توجد طلبات اشتراك معلقة.</p>}</div>}
  {adminSection === 'users' && <div><h4>إدارة الحسابات</h4><input className="admin-search" value={adminSearch} onChange={e=>setAdminSearch(e.target.value)} placeholder="ابحث بالاسم أو الهاتف أو الولاية"/><div className="request-list">{adminUsers.filter(u=>[u.display_name,u.phone,u.city,u.wilaya,u.role].some(v=>String(v||'').toLowerCase().includes(adminSearch.toLowerCase()))).map(user=><article className="request-card admin-record" key={user.id}><div><b>{user.display_name}</b><span className="request-status">{user.role}{user.is_verified?' · موثّق':''}</span></div><small>{[user.phone,user.wilaya,user.city].filter(Boolean).join(' · ')||user.id}</small>{profileRole==='owner'&&<><button type="button" className="admin-edit-full-button" disabled={busy} onClick={()=>openAdminUserEditor(user)}>تعديل كامل لبيانات الحساب</button><div className="admin-inline-controls"><label>الدور<select value={user.role} disabled={busy||user.id===session?.user?.id} onChange={e=>void saveAdminUser(user,{role:e.target.value})}><option value="customer">زبون</option><option value="professional">حرفي</option><option value="moderator">مشرف</option><option value="owner">مالك</option></select></label><label>الاشتراك<select value={user.subscription_active?'active':'inactive'} disabled={busy} onChange={e=>void saveAdminUser(user,{subscription_active:e.target.value==='active',subscription_ends_at:e.target.value==='active'?(user.subscription_ends_at||new Date(Date.now()+2592000000).toISOString()):null,subscription_plan:user.subscription_plan||'monthly'})}><option value="inactive">غير نشط</option><option value="active">نشط</option></select></label><label>التوثيق<select value={user.is_verified?'yes':'no'} disabled={busy||user.id===session?.user?.id} onChange={e=>void saveAdminUser(user,{is_verified:e.target.value==='yes'})}><option value="no">غير موثّق</option><option value="yes">موثّق</option></select></label></div><div className="admin-inline-controls"><label>حالة الحساب<select value={user.is_suspended?'suspended':'active'} disabled={busy||user.id===session?.user?.id} onChange={e=>void saveAdminUser(user,{is_suspended:e.target.value==='suspended',suspension_reason:e.target.value==='suspended'?'إيقاف من لوحة المالك':null})}><option value="active">نشط</option><option value="suspended">موقوف</option></select></label><label>نوع الاشتراك<select value={user.subscription_plan||'monthly'} disabled={busy} onChange={e=>void saveAdminUser(user,{subscription_plan:e.target.value})}><option value="monthly">عادي شهري</option><option value="pro_monthly">Pro شهري</option><option value="pro_yearly">Pro سنوي</option></select></label>{user.subscription_ends_at&&<small>ينتهي: {new Date(user.subscription_ends_at).toLocaleDateString('ar-DZ')}</small>}</div>{user.id!==session?.user?.id&&user.role!=='owner'&&<button className="secondary-action" disabled={busy} onClick={()=>void deleteAdminUser(user)}>حذف الحساب نهائيًا</button>}</>}</article>)}</div></div>}
  {adminSection === 'services' && <div><h4>مراجعة الخدمات</h4>{adminServices.map(service=><article className="request-card admin-record" key={service.id}><b>{service.title} — {service.category}</b><small>{service.wilaya} · {service.city} · صاحب الخدمة: {service.professional_id}</small><p>{service.description||'لا يوجد وصف'}</p>{profileRole==='owner'&&<button disabled={busy} onClick={()=>void adminAction(async()=>supabase!.from('professional_services').update({is_active:!service.is_active}).eq('id',service.id),service.is_active?'تم إخفاء الخدمة.':'تم تفعيل الخدمة.')}>{service.is_active?'إخفاء الخدمة':'إظهار الخدمة'}</button>}</article>)}{!adminServices.length&&<p>لا توجد خدمات.</p>}</div>}
  {adminSection === 'requests' && <div><h4>إدارة طلبات العمل</h4>{adminRequests.map(request=><article className="request-card admin-record" key={request.id}><b>{request.title}</b><small>{request.status} · {new Date(request.created_at).toLocaleString('ar-DZ')}</small><p>{request.details||'دون تفاصيل'}</p><small>الزبون: {request.customer_id} · الحرفي: {request.professional_id}</small>{profileRole==='owner'&&<div className="request-actions"><button disabled={busy} onClick={()=>void adminAction(async()=>supabase!.from('service_requests').update({status:'accepted'}).eq('id',request.id),'تم تحديث الطلب.')}>قبول</button><button disabled={busy} onClick={()=>void adminAction(async()=>supabase!.from('service_requests').update({status:'completed'}).eq('id',request.id),'تم إنهاء الطلب.')}>إكمال</button><button className="secondary-action" disabled={busy} onClick={()=>void adminAction(async()=>supabase!.from('service_requests').update({status:'cancelled',cancellation_reason:'إلغاء من لوحة المالك'}).eq('id',request.id),'تم إلغاء الطلب.')}>إلغاء</button></div>}</article>)}</div>}
  {adminSection === 'payments' && <div><h4>طلبات الاشتراك والدفع</h4>{adminPayments.map(payment=><article className="request-card admin-record" key={payment.id}><div><b>{payment.plan_code} — {Number(payment.amount_dzd).toLocaleString('fr-DZ')} دج</b><span className="request-status">{payment.status}</span></div><small>الحساب: {payment.user_id} · النوع: {payment.account_type}</small><small>مرجع التحويل: {payment.transfer_reference}</small>{payment.receipt_path&&<p>مسار الإيصال: {payment.receipt_path}</p>}{payment.admin_note&&<p>{payment.admin_note}</p>}{profileRole==='owner'&&payment.status==='pending'&&<div className="request-actions"><button disabled={busy} onClick={()=>void reviewPayment(payment,true)}>الموافقة</button><button className="secondary-action" disabled={busy} onClick={()=>void reviewPayment(payment,false)}>رفض</button></div>}</article>)}{!adminPayments.length&&<p>لا توجد طلبات اشتراك.</p>}</div>}
  {adminSection === 'support' && profileRole==='owner' && <div className="admin-support-center"><h4>مراسلات الحرفيين مع المالك</h4><p>اختر حرفيًا لفتح محادثة مباشرة، حتى لو لم يرسل رسالة بعد.</p><div className="admin-support-layout"><div className="admin-support-people">{adminUsers.filter(u=>u.role==='professional').map(u=>{const count=adminSupportMessages.filter(m=>m.professional_id===u.id).length;return <button key={u.id} className={selectedSupportProfessionalId===u.id?'selected':''} onClick={()=>setSelectedSupportProfessionalId(u.id)}><span className="conversation-avatar"><MessageCircle size={17}/></span><span><b>{u.professional_name||u.display_name}</b><small>{u.phone||'دون هاتف'} · {count} رسالة</small></span></button>})}{!adminUsers.some(u=>u.role==='professional')&&<p>لا توجد حسابات حرفيين.</p>}</div><div className="chat-panel"><div className="chat-message-list">{selectedSupportProfessionalId?adminSupportMessages.filter(m=>m.professional_id===selectedSupportProfessionalId).map(m=><div key={m.id} className={m.sender_id===session.user.id?'chat-bubble mine':'chat-bubble'}><p>{m.body}</p><small>{m.sender_id===session.user.id?'مالك التطبيق':'الحرفي'} · {new Date(m.created_at).toLocaleString('ar-DZ',{dateStyle:'short',timeStyle:'short'})}</small></div>):<div className="chat-empty">اختر حرفيًا من القائمة لبدء المراسلة.</div>}</div>{selectedSupportProfessionalId&&<form className="chat-compose" onSubmit={sendOwnerSupportMessage}><input value={adminSupportDraft} onChange={e=>setAdminSupportDraft(e.target.value)} maxLength={5000} placeholder="اكتب ردك للحرفي…"/><button disabled={busy||!adminSupportDraft.trim()} type="submit" aria-label="إرسال رد المالك"><Send size={18}/></button></form>}</div></div></div>}{adminSection === 'categories' && <div><h4>إدارة التصنيفات</h4>{profileRole==='owner'&&<form className="admin-create-form" onSubmit={createAdminCategory}><input required minLength={2} maxLength={80} value={categoryDraft} onChange={e=>setCategoryDraft(e.target.value)} placeholder="اسم التصنيف الجديد"/><button disabled={busy}>إضافة تصنيف</button></form>}{adminCategories.map(cat=><article className="request-card admin-record" key={cat.id}><b>{cat.name}</b><small>الترتيب: {cat.sort_order} · {cat.is_active?'نشط':'مخفي'}</small>{profileRole==='owner'&&<div className="request-actions"><button disabled={busy} onClick={()=>void adminAction(async()=>supabase!.from('service_categories').update({is_active:!cat.is_active}).eq('id',cat.id),cat.is_active?'تم إخفاء التصنيف.':'تم تفعيل التصنيف.')}>{cat.is_active?'إخفاء':'تفعيل'}</button><button className="secondary-action" disabled={busy} onClick={()=>void adminAction(async()=>supabase!.from('service_categories').delete().eq('id',cat.id),'تم حذف التصنيف.')}>حذف</button></div>}</article>)}</div>}
  {adminSection === 'ads' && <div><h4>الإعلانات والعروض</h4>{profileRole==='owner'&&<form className="admin-create-form" onSubmit={createAdminAd}><input required minLength={2} maxLength={120} value={adTitleDraft} onChange={e=>setAdTitleDraft(e.target.value)} placeholder="عنوان الإعلان"/><textarea required minLength={2} maxLength={1000} value={adBodyDraft} onChange={e=>setAdBodyDraft(e.target.value)} placeholder="نص الإعلان"/><label>بداية العرض (اختياري)<input type="datetime-local" value={adStartDraft} onChange={e=>setAdStartDraft(e.target.value)}/></label><label>نهاية العرض (اختياري)<input type="datetime-local" min={adStartDraft||undefined} value={adEndDraft} onChange={e=>setAdEndDraft(e.target.value)}/></label><button disabled={busy}>حفظ كمسودة</button></form>}{adminAds.map(ad=><article className="request-card admin-record" key={ad.id}><b>{ad.title}</b><p>{ad.body}</p><small>{ad.is_active?'منشور':'مسودة'} · {ad.ends_at?('ينتهي '+new Date(ad.ends_at).toLocaleDateString('ar-DZ')):'دون تاريخ انتهاء'}</small>{profileRole==='owner'&&<div className="request-actions"><button disabled={busy} onClick={()=>void adminAction(async()=>supabase!.from('ads').update({is_active:!ad.is_active}).eq('id',ad.id),ad.is_active?'تم إيقاف الإعلان.':'تم نشر الإعلان.')}>{ad.is_active?'إيقاف':'نشر'}</button><button className="secondary-action" disabled={busy} onClick={()=>void adminAction(async()=>supabase!.from('ads').delete().eq('id',ad.id),'تم حذف الإعلان.')}>حذف</button></div>}</article>)}</div>}
  {adminSection === 'reports' && <div><h4>البلاغات التي تحتاج مراجعة</h4>{adminReports.length?<div className="request-list">{adminReports.map(report=><article className="request-card" key={report.id}><div><b>{report.reason}</b><span className="request-status">{report.status==='open'?'جديد':'قيد المراجعة'}</span></div><small>{new Date(report.created_at).toLocaleString('ar-DZ')}</small><div className="request-actions"><button disabled={busy} onClick={()=>void resolveReport(report.id,'resolved')}>تمت المراجعة</button><button className="secondary-action" disabled={busy} onClick={()=>void resolveReport(report.id,'dismissed')}>استبعاد البلاغ</button></div></article>)}</div>:<p>لا توجد بلاغات مفتوحة.</p>}</div>}
  {adminSection === 'settings' && <div><h4>إعدادات الأسعار والاشتراكات</h4>{profileRole==='owner'?<form className="admin-create-form" onSubmit={e=>{e.preventDefault();void adminAction(async()=>{const entries:[string,any][]=[['price_monthly',Number(adminSettings.price_monthly)],['price_pro_monthly',Number(adminSettings.price_pro_monthly)],['price_pro_yearly',Number(adminSettings.price_pro_yearly)],['ccp_account',String(adminSettings.ccp_account||'').trim()],['ccp_account_name',String(adminSettings.ccp_account_name||'').trim()],['baridimob_number',String(adminSettings.baridimob_number||'').trim()],['baridimob_account_name',String(adminSettings.baridimob_account_name||'').trim()],['payment_instructions',String(adminSettings.payment_instructions||'').trim()]];for(const [key,value] of entries){const result=await supabase!.from('app_settings').upsert({key,value,updated_by:session?.user?.id,updated_at:new Date().toISOString()});if(result.error)return result;}return {error:null};},'تم حفظ أسعار الاشتراكات.');}}><label>الاشتراك العادي الشهري (دج)<input type="number" min="1" required value={adminSettings.price_monthly||1000} onChange={e=>setAdminSettings(s=>({...s,price_monthly:Number(e.target.value)}))}/></label><label>اشتراك Pro الشهري (دج)<input type="number" min="1" required value={adminSettings.price_pro_monthly||1500} onChange={e=>setAdminSettings(s=>({...s,price_pro_monthly:Number(e.target.value)}))}/></label><label>اشتراك Pro السنوي (دج)<input type="number" min="1" required value={adminSettings.price_pro_yearly||13000} onChange={e=>setAdminSettings(s=>({...s,price_pro_yearly:Number(e.target.value)}))}/></label><div className="admin-payment-settings"><h5>بيانات الدفع التي ستظهر للحرفيين والزبائن</h5><label>رقم حساب CCP<input required value={adminSettings.ccp_account||''} onChange={e=>setAdminSettings(s=>({...s,ccp_account:e.target.value}))} placeholder="أدخل رقم CCP الصحيح"/></label><label>اسم صاحب حساب CCP<input required value={adminSettings.ccp_account_name||''} onChange={e=>setAdminSettings(s=>({...s,ccp_account_name:e.target.value}))}/></label><label>رقم/هاتف بريدي موب<input required value={adminSettings.baridimob_number||''} onChange={e=>setAdminSettings(s=>({...s,baridimob_number:e.target.value}))} placeholder="رقم الحساب أو الهاتف المستعمل رسميًا"/></label><label>اسم مستفيد بريدي موب<input required value={adminSettings.baridimob_account_name||''} onChange={e=>setAdminSettings(s=>({...s,baridimob_account_name:e.target.value}))}/></label><label>تعليمات التحويل للعميل<textarea required maxLength={1000} rows={3} value={adminSettings.payment_instructions||''} onChange={e=>setAdminSettings(s=>({...s,payment_instructions:e.target.value}))}/></label><small>لن تُقبل طلبات الدفع عبر طريقة لا تحتوي على بيانات حساب محفوظة. لا تضع هنا رمزًا سريًا أو كلمة مرور أو PIN.</small></div><button disabled={busy}>حفظ الأسعار وبيانات الدفع</button></form>:<p>تعديل الأسعار متاح لمالك التطبيق فقط.</p>}</div>}
  {adminSection === 'audit' && <div><h4>سجل التدقيق الأمني</h4>{adminAuditLogs.length?<div className="audit-log-list">{adminAuditLogs.map(log=><article className="audit-log-item" key={log.id}><div><b>{log.action==='report_status_changed'?'تغيير حالة بلاغ':log.action==='request_status_changed'?'تغيير حالة طلب خدمة':String(log.action||'حدث إداري')}</b><span>{log.entity_type==='report'?'بلاغ':log.entity_type==='service_request'?'طلب خدمة':log.entity_type}</span></div><p>{log.details?.from?('من '+log.details.from+' إلى '+log.details.to):('السجل رقم '+log.entity_id)}</p><small>{new Date(log.created_at).toLocaleString('ar-DZ')}</small></article>)}</div>:<p className="audit-log-empty">لا توجد أحداث مسجلة بعد.</p>}</div>}
</div>}{session && profileRole === 'professional' && <div className="professional-form-card"><span className="section-kicker">ملفك المهني</span><h3>أضف خدمة إلى الدليل</h3><form onSubmit={submitProfessionalService}><label>اسم الخدمة<input required minLength={2} maxLength={100} value={serviceTitle} onChange={e=>setServiceTitle(e.target.value)} placeholder="مثال: إصلاح أعطال الكهرباء"/></label><label>التصنيف<select value={serviceCategory} onChange={e=>setServiceCategory(e.target.value)}><option>كهرباء</option><option>سباكة</option><option>دهان</option><option>نجارة</option><option>تكييف</option><option>أعمال منزلية</option><option>تنظيف</option><option>نقل الأثاث</option></select></label><label>وصف الخدمة<textarea rows={3} maxLength={1500} value={serviceDescription} onChange={e=>setServiceDescription(e.target.value)} placeholder="اشرح خبرتك وما تقدمه"/></label><div className="service-location-fields"><label>الولاية<input required value={serviceWilaya} onChange={e=>setServiceWilaya(e.target.value)} placeholder="الولاية"/></label><label>المدينة<input required value={serviceCity} onChange={e=>setServiceCity(e.target.value)} placeholder="البلدية"/></label></div><label>السعر الابتدائي بالدينار (اختياري)<input type="number" min="0" step="100" value={servicePrice} onChange={e=>setServicePrice(e.target.value)} placeholder="مثال: 1500"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ النشر…':'نشر الخدمة'}</button></form></div>}<div className="account-links"><button onClick={()=>setActiveTab('المفضلة')}><Heart size={18}/> الحرفيون المفضلون <span>{favorites.length}</span></button><button onClick={()=>setActiveTab('الرسائل')}><MessageCircle size={18}/> الرسائل والطلبات <ChevronLeft size={16}/></button></div></section> : <><section className="hero">
        <div className="hero-copy"><span className="eyebrow"><span className="pulse"/> منصتك للخدمات المحلية</span><h1>خدمة مليحة؟<br/><em>تلقاها في سلكني.</em></h1><p>تواصل مع حرفيين موثوقين في منطقتك، وقارن الخدمات بكل سهولة.</p></div>
        <div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="tool-emoji">🧰</div><div className="floating-tag"><ShieldCheck size={16}/> حرفيون موثوقون</div></div>
        <div className="hero-search"><Search size={20}/><input aria-label="ابحث عن خدمة أو حرفي" placeholder="واش راك حاب تصلّح اليوم؟" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>document.getElementById('professionals')?.scrollIntoView({behavior:'smooth'})}>ابحث</button></div>
      </section>
      <section className="trust-row"><div><ShieldCheck/><span><b>حرفيون موثوقون</b><small>ملفات وتقييمات واضحة</small></span></div><div><Clock3/><span><b>وفّر وقتك</b><small>ابحث في مكان واحد</small></span></div><div><BriefcaseBusiness/><span><b>خدمات متنوعة</b><small>اختيارات قريبة منك</small></span></div></section>
      {activeTab === 'الرئيسية' && liveAds.length > 0 && <section className="section live-ad-list"><div className="section-heading"><div><span className="section-kicker">من سلكني</span><h2>إعلانات وعروض</h2></div></div>{liveAds.map(ad=><article className="live-ad-card" key={ad.id}><b>{ad.title}</b><p>{ad.body}</p>{ad.target_url&&<a href={ad.target_url} target="_blank" rel="noreferrer">التفاصيل</a>}</article>)}</section>}
      {activeTab === 'الرئيسية' && <section className="section">
        <div className="section-heading"><div><span className="section-kicker">اختار واش تحتاج</span><h2>تصفّح حسب المهنة</h2></div><button className="text-button" onClick={()=>setCategory('الكل')}>كل المهن <ChevronLeft size={16}/></button></div>
        <div className="category-grid">{visibleCategories.map(c=>{const Icon=c.icon; return <button key={c.name} className={`category-card ${category===c.name?'selected':''}`} onClick={()=>setCategory(category===c.name?'الكل':c.name)}><span className={`category-icon ${c.color}`}><Icon size={23}/></span><b>{c.name}</b></button>})}</div>
      </section>}
      <section className="section" id="professionals">
        <div className="section-heading"><div><span className="section-kicker">ناس يخدموا بإتقان</span><h2>حرفيون مقترحون</h2></div><button className="filter-button" onClick={()=>setCity(city==='كل الولايات'?'الجزائر':'كل الولايات')}><SlidersHorizontal size={17}/> تصفية</button></div>
        <div className="results-line"><span>{visiblePros.length} حرفيين {activeTab === 'المفضلة' ? 'في المفضلة' : directoryLoaded ? 'في دليل سلكني' : 'في القائمة التجريبية'}</span><span className="sort-label">الأعلى تقييماً <ChevronLeft size={14}/></span></div>
        <div className="pro-list">{visiblePros.map(p=>{const Icon=p.icon; return <article className="pro-card" key={p.id || p.name}><div className={`pro-avatar ${p.color}`}>{p.initials}<span className="online-dot"/></div><div className="pro-info"><div className="pro-name-row"><h3>{p.name}</h3>{p.isVerified && <span className="verified"><ShieldCheck size={14}/> موثّق</span>}</div><p>{p.job}</p><div className="pro-meta"><span><MapPin size={13}/>{p.city}</span><span className="rating"><Star size={13} fill="currentColor"/>{p.rating}</span><span>{p.jobs}</span></div><div className="pro-bottom"><b>{p.price}</b><button className="view-pro-button" onClick={()=>setProfilePro(p)}>عرض الملف <ChevronLeft size={15}/></button><button onClick={()=>{setRequestPro(p);setRequestDetails('');setRequestDate('')}}>اطلب الخدمة <ChevronLeft size={15}/></button></div></div><button className={`favorite ${favorites.includes(p.name)?'is-favorite':''}`} aria-label="إضافة للمفضلة" onClick={()=>toggleFavorite(p.name)}><Heart size={18} fill={favorites.includes(p.name)?'currentColor':'none'}/></button><button className="report-pro-button" aria-label="الإبلاغ عن الحرفي" title="الإبلاغ عن ملف" onClick={()=>{if(!p.professionalId){setNotice('هذه بطاقة تجريبية؛ لا يمكن إرسال بلاغ عنها قبل تهيئة دليل الحرفيين الحقيقي.');return;}setNotice('');setReportPro(p);setReportReason('')}}><Flag size={14}/></button></article>})}
          {visiblePros.length===0 && <div className="empty-state"><Search size={30}/><b>ما لقيناش نتائج</b><span>جرّب كلمة أخرى أو اختار مهنة مختلفة.</span><button onClick={()=>{setQuery('');setCategory('الكل');if(activeTab==='المفضلة')setActiveTab('الرئيسية')}}>إظهار الكل</button></div>}
        </div>
      </section>
      {activeTab === 'الرئيسية' && <section className="join-banner"><div className="join-icon"><BriefcaseBusiness size={26}/></div><div><h3>أنت حرفي؟ سلكني يعرّف الناس بخدمتك.</h3><p>أنشئ ملفك المهني وابدأ في استقبال طلبات الزبائن.</p></div><button onClick={()=>setActiveTab('حسابي')}>انضم كحرفي <ChevronLeft size={16}/></button></section>}
      {!supabaseConfigured && <p className="config-note">واجهة أولية تعمل محليًا. الحرفيون المعروضون أمثلة تجريبية؛ اضبط متغيرات Supabase لعرض الدليل الحقيقي وتفعيل الحسابات والطلبات.</p>}
      </>}
    </main>
    <nav className="bottom-nav">{[{name:'الرئيسية',icon:Home},{name:'المفضلة',icon:Heart},{name:'الرسائل',icon:MessageCircle},{name:'حسابي',icon:UserRound}].map(t=>{const Icon=t.icon;return <button key={t.name} className={activeTab===t.name?'active':''} onClick={()=>setActiveTab(t.name)}><Icon size={21}/><span>{t.name}</span></button>})}</nav>
    {authOpen && <div className="modal-backdrop" role="presentation" onClick={()=>setAuthOpen(false)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="تسجيل الحساب" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setAuthOpen(false)}><X/></button><span className="section-kicker">مرحبًا بك في سلكني</span><h2>{authMode==='login'?'تسجيل الدخول':'إنشاء حساب جديد'}</h2><form onSubmit={submitAuth}>{authMode==='signup' && <><label>الاسم الكامل<input required minLength={2} value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="اكتب اسمك"/></label><label>نوع الحساب<select value={accountType} onChange={e=>setAccountType(e.target.value as 'customer'|'professional')}><option value="customer">زبون — أبحث عن خدمات</option><option value="professional">حرفي — أقدم خدمات</option></select></label>{accountType==='professional' && <><label>اسم الشهرة المهني <span className="required-phone-mark">ظاهر للزبائن</span><input required minLength={2} maxLength={60} value={authProfessionalName} onChange={e=>setAuthProfessionalName(e.target.value)} placeholder="مثال: محمد للكهرباء"/><small className="phone-field-hint">سيظهر هذا الاسم بدل اسم الحساب في نتائج البحث والملف المهني.</small></label><label>رقم الهاتف المهني <span className="required-phone-mark">إلزامي وثابت</span><input required type="tel" inputMode="tel" autoComplete="tel" maxLength={16} value={authPhone} onChange={e=>setAuthPhone(e.target.value)} placeholder="0550123456"/><small className="phone-field-hint">سيظهر للزبائن في ملفك، ولا يمكنك تغييره بعد إنشاء الحساب.</small></label></>}<label>البريد الإلكتروني<input required type="email" autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="name@example.com"/></label><label>كلمة المرور<input required type="password" minLength={6} autoComplete={authMode==='login'?'current-password':'new-password'} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="6 أحرف على الأقل"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ التنفيذ…':authMode==='login'?'دخول آمن':'إنشاء الحساب'} <ChevronLeft size={17}/></button></form>{authMode==='login' && <button className="forgot-password" type="button" onClick={async()=>{setNotice('');if(!supabase){setNotice('أضف إعدادات Supabase أولًا.');return;}if(!authEmail.trim()){setNotice('اكتب بريدك الإلكتروني أولًا.');return;}setBusy(true);const {error}=await supabase.auth.resetPasswordForEmail(authEmail.trim(),{redirectTo:window.location.origin});setBusy(false);setNotice(error?error.message:'إذا كان البريد مسجلًا، فستصلك رسالة لاستعادة كلمة المرور.');}}>نسيت كلمة المرور؟</button>}<p className="switch-auth">{authMode==='login'?'ليس لديك حساب؟':'لديك حساب بالفعل؟'} <button onClick={()=>{setAuthMode(authMode==='login'?'signup':'login');setNotice('')}}>{authMode==='login'?'إنشاء حساب':'تسجيل الدخول'}</button></p></section></div>}
    {profilePro && <div className="modal-backdrop profile-modal-backdrop" role="presentation" onClick={()=>setProfilePro(null)}><section className="app-modal professional-profile-modal" role="dialog" aria-modal="true" aria-label={`ملف ${profilePro.name}`} onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setProfilePro(null)}><X/></button><div className="profile-cover"><div className={`profile-hero-avatar ${profilePro.color}`}>{profilePro.initials}</div><span className="profile-verified-pill">{profilePro.isVerified ? <><ShieldCheck size={14}/> حرفي موثّق</> : <><BriefcaseBusiness size={14}/> ملف حرفي</>}</span></div><div className="profile-heading"><div><span className="section-kicker">ملف الحرفي</span><h2>{profilePro.name}</h2><p>{profilePro.job}</p></div><div className="profile-rating-box"><Star size={17} fill="currentColor"/><b>{profilePro.rating}</b><small>تقييم العملاء</small></div></div><div className="profile-info-grid"><div><MapPin size={17}/><span><b>منطقة الخدمة</b><small>{profilePro.city || 'لم تحدد المنطقة'}</small></span></div><div><BriefcaseBusiness size={17}/><span><b>الخدمات المنجزة</b><small>{profilePro.jobs || 'لا توجد بيانات بعد'}</small></span></div><div><ShieldCheck size={17}/><span><b>حالة التوثيق</b><small>{profilePro.isVerified ? 'تم توثيق الحساب' : 'غير موثّق بعد'}</small></span></div><div><Wrench size={17}/><span><b>التسعير</b><small>{profilePro.price}</small></span></div></div><div className="profile-description"><h3>نبذة عن الخدمة</h3><p>{profilePro.description?.trim() || 'لم يضف الحرفي وصفًا لهذه الخدمة بعد. يمكنك مراسلته لتوضيح تفاصيل العمل والسعر قبل الاتفاق.'}</p></div><div className="profile-actions"><button className="profile-message-button" disabled={busy} onClick={()=>void openProfessionalChat(profilePro)}><MessageCircle size={17}/>{busy?'جارٍ فتح المحادثة…':'راسل الحرفي مباشرة'}</button>{(profilePro.phone || '').trim() && <a className="profile-call-button" href={`tel:${(profilePro.phone || '').replace(/[^+\\d]/g,'')}`}><PhoneCall size={17}/><span>اتصال هاتفي</span></a>}<button className="profile-request-button" onClick={()=>{setRequestPro(profilePro);setRequestDetails('');setRequestDate('');setProfilePro(null)}}><Send size={16}/> طلب خدمة</button></div><p className="profile-safety-note"><ShieldCheck size={14}/> اتفق على تفاصيل العمل والسعر قبل البدء، ولا تشارك بياناتك السرية.</p></section></div>}
    {requestPro && <div className="modal-backdrop" role="presentation" onClick={()=>setRequestPro(null)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="طلب خدمة" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setRequestPro(null)}><X/></button><span className="section-kicker">طلب خدمة جديد</span><h2>{requestPro.job}</h2><p className="modal-subtitle">الحرفي: {requestPro.name} · {requestPro.city}</p><form onSubmit={submitRequest}><label>اشرح ما تحتاجه<textarea rows={4} maxLength={1500} value={requestDetails} onChange={e=>setRequestDetails(e.target.value)} placeholder="اكتب تفاصيل المشكلة والعنوان التقريبي…"/></label><label>موعد الحجز (اختياري — بعد يومين على الأقل)<input type="datetime-local" min={new Date(Date.now()+48*60*60*1000-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)} value={requestDate} onChange={e=>setRequestDate(e.target.value)}/><small>للعمل العاجل اترك الموعد فارغًا لبدء التواصل المباشر.</small></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit"><Send size={16}/>{busy?'جارٍ الإرسال…':'إرسال طلب الخدمة'}</button></form></section></div>}
    {reportPro && <div className="modal-backdrop" role="presentation" onClick={()=>setReportPro(null)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="الإبلاغ عن ملف" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setReportPro(null)}><X/></button><span className="section-kicker">حماية مجتمع سلكني</span><h2>الإبلاغ عن {reportPro.name}</h2><p className="modal-subtitle">سيصل البلاغ إلى فريق المراجعة. استخدم هذه الميزة للمخالفات الفعلية.</p><form onSubmit={submitReport}><label>سبب البلاغ<textarea required minLength={5} maxLength={1000} rows={4} value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="اشرح سبب البلاغ…"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ الإرسال…':'إرسال البلاغ'}</button></form></section></div>}
    {cancelRequestTarget && <div className="modal-backdrop" role="presentation" onClick={()=>setCancelRequestTarget(null)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="إلغاء طلب الخدمة" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setCancelRequestTarget(null)}><X/></button><span className="section-kicker">تأكيد الإلغاء</span><h2>إلغاء طلب الخدمة</h2><p className="modal-subtitle">يرجى توضيح سبب الإلغاء؛ سيظهر السبب في تفاصيل الطلب.</p><form onSubmit={submitCancellation}><label>سبب الإلغاء<textarea required minLength={5} maxLength={1000} rows={4} value={cancelReasonDraft} onChange={e=>setCancelReasonDraft(e.target.value)} placeholder="اكتب سبب الإلغاء…"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ الإلغاء…':'تأكيد إلغاء الطلب'}</button></form></section></div>}{reviewRequest && <div className="modal-backdrop" role="presentation" onClick={()=>setReviewRequest(null)}><section className="app-modal" role="dialog" aria-modal="true" aria-label="تقييم الخدمة" onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="إغلاق" onClick={()=>setReviewRequest(null)}><X/></button><span className="section-kicker">رأيك يساعد الآخرين</span><h2>قيّم الخدمة</h2><form onSubmit={submitReview}><label>التقييم</label><div className="rating-picker" dir="ltr">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={`${n} نجوم`} className={n<=reviewRating?'rating-selected':''} onClick={()=>setReviewRating(n)}><Star size={28} fill={n<=reviewRating?'currentColor':'none'}/></button>)}</div><label>تعليقك (اختياري)<textarea rows={3} maxLength={1500} value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="كيف كانت تجربتك؟"/></label>{notice && <p className="form-notice">{notice}</p>}<button className="modal-submit" disabled={busy} type="submit">{busy?'جارٍ الإرسال…':'إرسال التقييم'}</button></form></section></div>}
    {notice && !authOpen && !requestPro && <button className="toast-notice" onClick={()=>setNotice('')}>{notice} <X size={15}/></button>}
  </div>;
}