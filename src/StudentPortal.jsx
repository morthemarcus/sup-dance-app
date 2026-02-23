import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  GAS_URL: "/api/proxy",
  STRIPE_PUBLISHABLE_KEY: "",
  STUDIO_NAME: "SUP Dance",
  MONTHLY_MINIMUM: 100,
};

// ─────────────────────────────────────────────────────────────────────────────
// i18n — כל הטקסטים של האפליקציה
// ─────────────────────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    dir: "ltr",
    // Auth
    studentPortal: "Student Portal",
    email: "Email",
    password: "Password",
    emailPlaceholder: "your@email.com",
    passwordPlaceholder: "••••••••",
    signIn: "Sign In",
    signingIn: "Signing in…",
    forgotPassword: "Forgot password?",
    resetIt: "Reset it",
    forgotDesc: "Enter your email and your teacher will receive a reset request.",
    sendRequest: "Send Request",
    backToLogin: "← Back to login",
    resetSent: "Password reset requested — your teacher will send you a new one.",
    invalidCreds: "Invalid email or password. Contact your teacher to set up your account.",
    connectionError: "Connection error. Please try again.",
    fillFields: "Please enter your email and password.",
    demoMode: "Demo mode — enter any email/password to explore",
    // Nav
    home: "Home",
    classes: "Classes",
    notes: "Notes",
    pay: "Pay",
    profile: "Profile",
    // Dashboard
    welcomeBack: "Welcome back 👋",
    balanceDue: "Balance due",
    payNow: "Pay now →",
    paid: "Paid",
    thanks: "Thanks!",
    upcomingClasses: "Upcoming Classes",
    viewAll: "View all",
    notEnrolled: "You're not enrolled in any classes yet.",
    notesFromTeacher: "Notes from Teacher",
    allNotes: "All notes",
    recentClasses: "Recent Classes",
    // RSVP
    rsvpComing: "✓ I'm coming",
    rsvpNotComing: "✗ Not coming",
    rsvpMaybe: "⏳ I'll update soon",
    rsvpAttending: "attending",
    rsvpStatus: "Your RSVP:",
    loadingClasses: "Loading your classes…",
    // Schedule
    classSchedule: "Class Schedule",
    browseClasses: "Browse all classes and manage your enrollment",
    enrolled: "Enrolled",
    sessionsAttended: (n) => `You've attended ${n} session${n !== 1 ? "s" : ""} of this class.`,
    youreEnrolled: "✓ You're enrolled",
    unenroll: "Unenroll",
    registerClass: "Register for this class",
    noClasses: "No classes available right now.",
    next: "Next",
    perClass: "/class",
    // Notes
    teacherNotes: "Teacher Notes",
    feedbackDesc: "Personal feedback from your classes",
    noNotes: "No notes yet — they'll appear here after each class.",
    latest: "✦ Latest",
    note: "Note",
    // Payments
    payments: "Payments",
    billingDesc: "Your billing history and outstanding balance",
    totalOutstanding: "Total Outstanding",
    payViaStripe: "💳 Pay Now via Stripe",
    stripeSecure: "Secure payment processed by Stripe. You'll receive a receipt by email.",
    paymentHistory: "Payment History",
    classesAttended: (n) => `${n} class${n !== 1 ? "es" : ""} attended`,
    howPricing: "How pricing works",
    pricingDesc: (price, min) => `Each class is ₪${price}. You're charged the greater of your actual classes or the monthly minimum of ₪${min}.`,
    // Profile
    myProfile: "My Profile",
    profileUpdated: "✓ Profile updated",
    classesEnrolled: "Classes\nenrolled",
    sessionsThisYear: "Sessions\nthis year",
    totalSessions: "Total\nsessions",
    personalInfo: "Personal Info",
    edit: "Edit",
    phone: "Phone",
    emailLabel: "Email",
    birthday: "Birthday",
    memberSince: "Member since",
    emergencyContact: "Emergency contact",
    editProfile: "Edit Profile",
    name: "Name",
    phonePlaceholder: "+972-50-000-0000",
    emergencyPlaceholder: "Name — phone number",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    myClasses: "My Classes",
    active: "Active",
    notEnrolledClasses: "Not enrolled in any classes.",
    signOut: "Sign Out",
    // Payment modal
    payment: "Payment",
    demoStripe: "Add your Stripe key in CONFIG.STRIPE_PUBLISHABLE_KEY to enable real payments.",
    paySecurely: "Pay Securely",
    simulatePayment: "Simulate Payment",
    stripeEncryption: "Powered by Stripe · 256-bit encryption",
    processingPayment: "Processing payment…",
    paymentConfirmed: "Payment confirmed!",
    received: (amount) => `₪${amount} received`,
    paymentFailed: "Payment failed. Please try again or contact your teacher.",
    // Days
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    monthFormat: (mk) => {
      const [y, m] = mk.split("-");
      return new Date(+y, +m - 1, 1).toLocaleString("en", { month: "long", year: "numeric" });
    },
    dateFormat: (d) => new Date(d).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" }),
    nextDate: (date) => date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }),
  },

  he: {
    dir: "rtl",
    // Auth
    studentPortal: "פורטל תלמידות",
    email: "אימייל",
    password: "סיסמה",
    emailPlaceholder: "האימייל שלך",
    passwordPlaceholder: "••••••••",
    signIn: "כניסה",
    signingIn: "מתחברת…",
    forgotPassword: "שכחתי סיסמה",
    resetIt: "לאיפוס",
    forgotDesc: "הכניסי את האימייל שלך והמורה תקבל בקשת איפוס.",
    sendRequest: "שלח בקשה",
    backToLogin: "← חזרה להתחברות",
    resetSent: "בקשת האיפוס נשלחה — המורה תשלח לך סיסמה חדשה.",
    invalidCreds: "אימייל או סיסמה שגויים. פני למורה שלך להגדיר את החשבון.",
    connectionError: "שגיאת חיבור. נסי שוב.",
    fillFields: "נא להזין אימייל וסיסמה.",
    demoMode: "מצב הדגמה — הזיני כל אימייל/סיסמה לחקור",
    // Nav
    home: "בית",
    classes: "שיעורים",
    notes: "הערות",
    pay: "תשלום",
    profile: "פרופיל",
    // Dashboard
    welcomeBack: "ברוכה השבה 👋",
    balanceDue: "יתרה לתשלום",
    payNow: "שלמי עכשיו ←",
    paid: "שולם",
    thanks: "תודה!",
    upcomingClasses: "שיעורים הקרובים",
    viewAll: "הצג הכל",
    notEnrolled: "עוד לא נרשמת לאף שיעור.",
    notesFromTeacher: "הערות מהמורה",
    allNotes: "כל ההערות",
    recentClasses: "שיעורים אחרונים",
    // RSVP
    rsvpComing: "✓ מגיעה",
    rsvpNotComing: "✗ לא מגיעה",
    rsvpMaybe: "⏳ אעדכן בקרוב",
    rsvpAttending: "מגיעים",
    rsvpStatus: "הסטטוס שלך:",
    loadingClasses: "טוענת את השיעורים שלך…",
    // Schedule
    classSchedule: "מערכת שיעורים",
    browseClasses: "עיין בכל השיעורים ונהל את הרשמתך",
    enrolled: "רשומה",
    sessionsAttended: (n) => `השתתפת ב-${n} ${n === 1 ? "מפגש" : "מפגשים"} בשיעור זה.`,
    youreEnrolled: "✓ את רשומה",
    unenroll: "בטל רישום",
    registerClass: "הרשמה לשיעור",
    noClasses: "אין שיעורים זמינים כרגע.",
    next: "הבא",
    perClass: "לשיעור/",
    // Notes
    teacherNotes: "הערות מהמורה",
    feedbackDesc: "משוב אישי מהשיעורים שלך",
    noNotes: "אין הערות עדיין — הן יופיעו כאן אחרי כל שיעור.",
    latest: "✦ אחרונה",
    note: "הערה",
    // Payments
    payments: "תשלומים",
    billingDesc: "היסטוריית חיובים ויתרה לתשלום",
    totalOutstanding: "סה״כ לתשלום",
    payViaStripe: "💳 תשלום דרך Stripe",
    stripeSecure: "תשלום מאובטח דרך Stripe. תקבלי קבלה במייל.",
    paymentHistory: "היסטוריית תשלומים",
    classesAttended: (n) => `${n} ${n === 1 ? "שיעור" : "שיעורים"} בחודש`,
    howPricing: "איך עובד התמחור",
    pricingDesc: (price, min) => `כל שיעור עולה ₪${price}. מחויבת בגדול מבין השיעורים שנוכחת בהם לבין המינימום החודשי של ₪${min}.`,
    // Profile
    myProfile: "הפרופיל שלי",
    profileUpdated: "✓ הפרופיל עודכן",
    classesEnrolled: "שיעורים\nרשומים",
    sessionsThisYear: "מפגשים\nהשנה",
    totalSessions: "סה״כ\nמפגשים",
    personalInfo: "פרטים אישיים",
    edit: "עריכה",
    phone: "טלפון",
    emailLabel: "אימייל",
    birthday: "יום הולדת",
    memberSince: "חברה מאז",
    emergencyContact: "איש קשר לחירום",
    editProfile: "ערוך פרופיל",
    name: "שם",
    phonePlaceholder: "050-000-0000",
    emergencyPlaceholder: "שם — מספר טלפון",
    saveChanges: "שמור שינויים",
    cancel: "ביטול",
    myClasses: "השיעורים שלי",
    active: "פעיל",
    notEnrolledClasses: "לא רשומה לאף שיעור.",
    signOut: "התנתק",
    // Payment modal
    payment: "תשלום",
    demoStripe: "הוסיפי את מפתח Stripe ב-CONFIG.STRIPE_PUBLISHABLE_KEY להפעלת תשלומים אמיתיים.",
    paySecurely: "תשלום מאובטח",
    simulatePayment: "סימולציית תשלום",
    stripeEncryption: "מופעל על ידי Stripe · הצפנה 256-bit",
    processingPayment: "מעבד תשלום…",
    paymentConfirmed: "התשלום אושר!",
    received: (amount) => `₪${amount} התקבל`,
    paymentFailed: "התשלום נכשל. נסי שוב או פני למורה.",
    // Days
    days: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
    monthFormat: (mk) => {
      const [y, m] = mk.split("-");
      return new Date(+y, +m - 1, 1).toLocaleString("he", { month: "long", year: "numeric" });
    },
    dateFormat: (d) => new Date(d).toLocaleDateString("he", { day: "numeric", month: "short", year: "numeric" }),
    nextDate: (date) => date.toLocaleDateString("he", { weekday: "short", month: "short", day: "numeric" }),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const LangContext = createContext({ lang: "he", t: TRANSLATIONS.he, setLang: () => {} });
const useLang = () => useContext(LangContext);

// ─────────────────────────────────────────────────────────────────────────────
// DATA LAYER
// ─────────────────────────────────────────────────────────────────────────────
const GAS = {
  async call(action, payload = {}) {
    if (!CONFIG.GAS_URL) return null;
    try {
      const res = await fetch(CONFIG.GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      return await res.json();
    } catch (e) { return null; }
  },
  async getStudioData() { return this.call("getStudioData"); },
  async loginStudent(email, password) { return this.call("studentLogin", { email, password }); },
  async registerClass(studentId, classId) { return this.call("registerClass", { studentId, classId }); },
  async unregisterClass(studentId, classId) { return this.call("unregisterClass", { studentId, classId }); },
  async updateProfile(studentId, data) { return this.call("updateStudentProfile", { studentId, data }); },
  async logPayment(studentId, amount, description, stripePaymentId) {
    return this.call("logPayment", { studentId, amount, description, stripePaymentId });
  },
  async rsvp(studentId, classId, date, status) {
    return this.call("rsvp", { studentId, classId, date, status });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_CLASSES = [
  { id: "c1", name: "Monday Jazz", day: "Monday", time: "19:00", pricePerClass: 40, archived: false },
  { id: "c2", name: "Thursday Contemporary", day: "Thursday", time: "18:30", pricePerClass: 40, archived: false },
];
const DEMO_STUDENT = {
  id: "s1", name: "נועה כהן", phone: "050-1234567", email: "noa@example.com",
  birthday: "1995-03-15", joinDate: "2024-09-01", assignedClasses: ["c1", "c2"],
  emergencyContact: "שרה כהן — 052-9876543", notes: "מתקדמת",
};
const DEMO_ATTENDANCE = [
  { date: "2026-02-17", classId: "c1", className: "Monday Jazz" },
  { date: "2026-02-10", classId: "c1", className: "Monday Jazz" },
  { date: "2026-02-13", classId: "c2", className: "Thursday Contemporary" },
  { date: "2026-01-27", classId: "c1", className: "Monday Jazz" },
  { date: "2026-01-20", classId: "c1", className: "Monday Jazz" },
  { date: "2026-01-16", classId: "c2", className: "Thursday Contemporary" },
];
const DEMO_NOTES = [
  { id: "n1", ts: "2026-02-17T10:00:00", text: "שיפור יפהפה בתנועות הידיים! שימי דגש על האצבעות בשיעור הבא. התזמון שלך עם המוזיקה ממש מדויק." },
  { id: "n2", ts: "2026-02-13T18:00:00", text: "עבודת רצפה חזקה היום — זכרי לנשום דרך הסדרות. הגמישות שלך מתקדמת יפה, במיוחד בעמוד השדרה." },
  { id: "n3", ts: "2026-01-27T10:00:00", text: "אנרגיה ומחויבות מצוינות השבוע. עבדי על מעברי הידיים בין הפרזות — זה יחבר את הכל." },
];
const DEMO_PAYMENTS = {
  "s1-2026-02": { status: "unpaid" },
  "s1-2026-01": { status: "paid" },
  "s1-2025-12": { status: "paid" },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const nextOccurrence = (dayName, t) => {
  const dayIdx = DAYS_EN.indexOf(dayName);
  const today = new Date();
  const diff = (dayIdx - today.getDay() + 7) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return t.nextDate(next);
};

// מחזיר תאריך YYYY-MM-DD של השיעור הבא
const nextOccurrenceDate = (dayName) => {
  const dayIdx = DAYS_EN.indexOf(dayName);
  const today = new Date();
  const diff = (dayIdx - today.getDay() + 7) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().slice(0, 10);
};

const calcMonthCost = (attendance, classes, mk) => {
  const recs = attendance.filter((r) => r.date.startsWith(mk));
  let total = 0;
  recs.forEach((r) => { const cls = classes.find((c) => c.id === r.classId); total += cls?.pricePerClass || 40; });
  return Math.max(CONFIG.MONTHLY_MINIMUM, total);
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const Tk = {
  bg: "#0c0a14", surface: "#13101e", card: "#1a1628", border: "#272040",
  borderLight: "#332a52", accent: "#e8445a", accentDim: "#e8445a33",
  accentHover: "#ff5a70", gold: "#f5a623", goldDim: "#f5a62322",
  purple: "#8b5cf6", purpleDim: "#8b5cf622", green: "#22c55e", greenDim: "#22c55e22",
  text: "#f0ecf8", textMuted: "#8a7aaa", textDim: "#5a4e78",
  danger: "#ff4444", warning: "#f59e0b",
};
const FONT = "'DM Sans', 'Arial', sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE TOGGLE BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function LangToggle({ compact = false }) {
  const { lang, setLang } = useLang();
  const next = lang === "he" ? "en" : "he";
  const label = lang === "he" ? "EN" : "עב";

  return (
    <button
      onClick={() => setLang(next)}
      title={lang === "he" ? "Switch to English" : "עבור לעברית"}
      style={{
        background: "transparent",
        border: `1px solid ${Tk.border}`,
        borderRadius: 8,
        color: Tk.textMuted,
        fontFamily: FONT,
        fontSize: compact ? 12 : 13,
        fontWeight: 700,
        padding: compact ? "4px 10px" : "6px 13px",
        cursor: "pointer",
        letterSpacing: 0.5,
        transition: "all 0.18s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = Tk.accent; e.currentTarget.style.color = Tk.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = Tk.border; e.currentTarget.style.color = Tk.textMuted; }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${Tk.accent}, ${Tk.purple})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700, color: "#fff", letterSpacing: 0.5,
      fontFamily: FONT,
    }}>
      {initials.toUpperCase()}
    </div>
  );
}

function Chip({ children, color = Tk.accent, style = {} }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 600,
      fontFamily: FONT, whiteSpace: "nowrap", ...style,
    }}>{children}</span>
  );
}

function Card({ children, style = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: Tk.card, border: `1px solid ${hov && onClick ? Tk.borderLight : Tk.border}`,
        borderRadius: 16, padding: 18,
        transform: hov && onClick ? "translateY(-1px)" : "none",
        boxShadow: hov && onClick ? "0 8px 32px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
        transition: "all 0.2s", cursor: onClick ? "pointer" : "default", ...style,
      }}>{children}</div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }) {
  const [hov, setHov] = useState(false);
  const { t } = useLang();
  const base = {
    border: "none", borderRadius: 12, fontFamily: FONT, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.18s",
    opacity: disabled ? 0.5 : 1, letterSpacing: 0.2,
    fontSize: size === "sm" ? 12 : size === "lg" ? 16 : 14,
    padding: size === "sm" ? "7px 14px" : size === "lg" ? "14px 28px" : "11px 20px",
    display: "inline-flex", alignItems: "center", gap: 6,
    direction: t.dir,
    ...style,
  };
  const vars = {
    primary: { background: hov ? Tk.accentHover : Tk.accent, color: "#fff" },
    ghost: { background: "transparent", border: `1px solid ${Tk.border}`, color: Tk.textMuted },
    outline: { background: hov ? Tk.accentDim : "transparent", border: `1px solid ${Tk.accent}`, color: Tk.accent },
    success: { background: hov ? "#16a34a" : Tk.green, color: "#fff" },
    subtle: { background: hov ? Tk.border : "transparent", border: `1px solid ${Tk.border}`, color: Tk.text },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...vars[variant] }}>{children}</button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "", style = {} }) {
  const [foc, setFoc] = useState(false);
  const { t } = useLang();
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && (
        <label style={{
          display: "block", color: Tk.textMuted, fontSize: 11, fontWeight: 600,
          marginBottom: 6, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: FONT,
        }}>{label}</label>
      )}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        dir={t.dir}
        style={{
          width: "100%", boxSizing: "border-box", fontFamily: FONT,
          background: Tk.surface, border: `1px solid ${foc ? Tk.accent : Tk.border}`,
          borderRadius: 10, padding: "12px 14px", color: Tk.text, fontSize: 15, outline: "none",
          transition: "border-color 0.2s", textAlign: t.dir === "rtl" ? "right" : "left",
        }}
      />
    </div>
  );
}

function Section({ title, action, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ color: Tk.text, fontSize: 15, fontWeight: 700, margin: 0, fontFamily: FONT }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function PayBadge({ status }) {
  const { t } = useLang();
  if (status === "paid") return <Chip color={Tk.green}>✓ {t.paid}</Chip>;
  if (status === "partial") return <Chip color={Tk.gold}>~ Partial</Chip>;
  return <Chip color={Tk.danger}>{t.lang === "he" ? "לא שולם" : "Unpaid"}</Chip>;
}

function BottomSheet({ title, onClose, children }) {
  const { t } = useLang();
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: Tk.surface, borderRadius: "20px 20px 0 0", width: "100%",
          maxHeight: "90vh", overflowY: "auto", padding: "24px 20px 48px",
          boxShadow: "0 -24px 64px rgba(0,0,0,0.6)",
          animation: "sheetIn 0.3s cubic-bezier(0.4,0,0.2,1)",
          direction: t.dir,
        }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: Tk.border, margin: "0 auto 20px" }} />
        {title && <h3 style={{ color: Tk.text, fontFamily: SERIF, fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const { t, lang, setLang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError(t.fillFields); return; }
    setLoading(true); setError("");
    try {
      const gasResult = CONFIG.GAS_URL ? await GAS.loginStudent(email.trim(), password) : null;
      if (gasResult?.ok) {
        onLogin(gasResult.student);
      } else if (!CONFIG.GAS_URL) {
        onLogin({ ...DEMO_STUDENT, email: email.trim(), _demo: true });
      } else {
        setError(t.invalidCreds);
      }
    } catch { setError(t.connectionError); }
    setLoading(false);
  };

  return (
    <div dir={t.dir} style={{
      minHeight: "100vh", background: Tk.bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT,
    }}>
      <div style={{ position: "fixed", top: 20, [t.dir === "rtl" ? "left" : "right"]: 20, zIndex: 10 }}>
        <LangToggle />
      </div>
      <div style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(${Tk.accent}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, margin: "0 auto 20px", background: `linear-gradient(135deg, ${Tk.accent}, ${Tk.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: `0 16px 48px ${Tk.accent}44` }}>💃</div>
          <h1 style={{ color: Tk.text, fontFamily: SERIF, fontSize: 32, fontWeight: 700, marginBottom: 6 }}>{CONFIG.STUDIO_NAME}</h1>
          <p style={{ color: Tk.textMuted, fontSize: 15 }}>{t.studentPortal}</p>
        </div>
        {mode === "login" && (
          <Card>
            <Input label={t.email} type="email" value={email} onChange={setEmail} placeholder={t.emailPlaceholder} />
            <Input label={t.password} type="password" value={password} onChange={setPassword} placeholder={t.passwordPlaceholder} />
            {error && <p style={{ color: Tk.danger, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>{error}</p>}
            <Btn onClick={handleLogin} variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? t.signingIn : t.signIn}
            </Btn>
            <p style={{ textAlign: "center", color: Tk.textMuted, fontSize: 13, marginTop: 18, cursor: "pointer" }} onClick={() => setMode("forgot")}>
              {t.forgotPassword}{" "}<span style={{ color: Tk.accent }}>{t.resetIt}</span>
            </p>
          </Card>
        )}
        {mode === "forgot" && (
          <Card>
            <p style={{ color: Tk.textMuted, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{t.forgotDesc}</p>
            <Input label={t.email} type="email" value={email} onChange={setEmail} placeholder={t.emailPlaceholder} />
            <Btn onClick={() => { setMode("login"); setError(t.resetSent); }} style={{ width: "100%", justifyContent: "center" }}>
              {t.sendRequest}
            </Btn>
            <p style={{ textAlign: "center", color: Tk.textMuted, fontSize: 13, marginTop: 14, cursor: "pointer" }} onClick={() => setMode("login")}>{t.backToLogin}</p>
          </Card>
        )}
        {!CONFIG.GAS_URL && (
          <p style={{ textAlign: "center", color: Tk.textDim, fontSize: 11, marginTop: 24 }}>{t.demoMode}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ student, classes, attendance, notes, payments, rsvps, onNavigate, onSync, syncing, onRsvp }) {
  const { t } = useLang();
  const mk = monthKey();
  const myClasses = classes.filter((c) => student.assignedClasses?.includes(c.id) && !c.archived);
  const cost = calcMonthCost(attendance, classes, mk);
  const payStatus = payments[`${student.id}-${mk}`]?.status || "unpaid";
  const latestNotes = [...notes].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 2);
  const recentAttendance = [...attendance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const firstName = student.name.trim().split(" ")[0];

  return (
    <div style={{ padding: "0 0 100px" }}>
      <div style={{
        background: `linear-gradient(160deg, ${Tk.accent}18 0%, ${Tk.purple}12 100%)`,
        borderBottom: `1px solid ${Tk.border}`, padding: "24px 20px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Avatar name={student.name} size={50} />
            <div>
              <p style={{ color: Tk.textMuted, fontSize: 13, marginBottom: 2 }}>{t.welcomeBack}</p>
              <h2 style={{ color: Tk.text, fontFamily: SERIF, fontSize: 22, fontWeight: 700 }}>{firstName}</h2>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LangToggle compact />
            <button onClick={onSync} style={{ background: "none", border: "none", color: syncing ? Tk.accent : Tk.textMuted, cursor: "pointer", fontSize: 20, padding: 8, animation: syncing ? "spin 1s linear infinite" : "none" }}>⟳</button>
          </div>
        </div>

        {payStatus !== "paid" && (
          <div onClick={() => onNavigate("payments")} style={{
            marginTop: 20, background: `${Tk.accent}18`, border: `1px solid ${Tk.accent}44`,
            borderRadius: 14, padding: "14px 18px", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <p style={{ color: Tk.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{t.balanceDue} — {t.monthFormat(mk)}</p>
              <p style={{ color: Tk.accent, fontSize: 28, fontWeight: 800, fontFamily: SERIF }}>₪{cost}</p>
            </div>
            <Btn variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onNavigate("payments"); }}>{t.payNow}</Btn>
          </div>
        )}
        {payStatus === "paid" && (
          <div style={{ marginTop: 20, background: Tk.greenDim, border: `1px solid ${Tk.green}44`, borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <div>
              <p style={{ color: Tk.green, fontSize: 13, fontWeight: 600 }}>{t.monthFormat(mk)} — {t.paid}</p>
              <p style={{ color: Tk.textMuted, fontSize: 12 }}>₪{cost} · {t.thanks}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        {/* RSVP Section */}
        <Section title={t.upcomingClasses} action={<span style={{ color: Tk.accent, fontSize: 13, cursor: "pointer" }} onClick={() => onNavigate("schedule")}>{t.viewAll}</span>}>
          {myClasses.length === 0 && <p style={{ color: Tk.textMuted, fontSize: 14 }}>{t.notEnrolled}</p>}
          {myClasses.map((c) => {
            const nextDate = nextOccurrenceDate(c.day);
            const rsvpKey = `${student.id}-${c.id}-${nextDate}`;
            const myRsvp = (rsvps || {})[rsvpKey]?.status || null;
            const comingCount = Object.entries(rsvps || {})
              .filter(([k, v]) => k.includes(`-${c.id}-${nextDate}`) && v.status === "coming").length;
            const statusColor = myRsvp === "coming" ? Tk.green : myRsvp === "not_coming" ? Tk.danger : Tk.gold;

            return (
              <Card key={c.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <p style={{ color: Tk.text, fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{c.name}</p>
                    <p style={{ color: Tk.textMuted, fontSize: 12 }}>{t.days[DAYS_EN.indexOf(c.day)]} · {c.time}</p>
                  </div>
                  {comingCount > 0 && (
                    <span style={{ color: Tk.green, fontSize: 12, background: Tk.greenDim, padding: "3px 10px", borderRadius: 20, border: `1px solid ${Tk.green}33` }}>
                      {comingCount} {t.rsvpAttending}
                    </span>
                  )}
                </div>

                {myRsvp && (
                  <p style={{ color: statusColor, fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                    {t.rsvpStatus} {myRsvp === "coming" ? t.rsvpComing : myRsvp === "not_coming" ? t.rsvpNotComing : t.rsvpMaybe}
                  </p>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn size="sm" variant={myRsvp === "coming" ? "success" : "ghost"}
                    onClick={() => onRsvp(c.id, nextDate, "coming")}>
                    {t.rsvpComing}
                  </Btn>
                  <Btn size="sm" variant="ghost"
                    style={myRsvp === "not_coming" ? { borderColor: Tk.danger, color: Tk.danger } : {}}
                    onClick={() => onRsvp(c.id, nextDate, "not_coming")}>
                    {t.rsvpNotComing}
                  </Btn>
                  <Btn size="sm" variant="ghost"
                    style={myRsvp === "maybe" ? { borderColor: Tk.gold, color: Tk.gold } : {}}
                    onClick={() => onRsvp(c.id, nextDate, "maybe")}>
                    {t.rsvpMaybe}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </Section>

        {latestNotes.length > 0 && (
          <Section title={t.notesFromTeacher} action={<span style={{ color: Tk.accent, fontSize: 13, cursor: "pointer" }} onClick={() => onNavigate("notes")}>{t.allNotes}</span>}>
            {latestNotes.map((n) => (
              <Card key={n.id} style={{ marginBottom: 10, borderLeft: t.dir === "ltr" ? `3px solid ${Tk.gold}` : "none", borderRight: t.dir === "rtl" ? `3px solid ${Tk.gold}` : "none" }}>
                <p style={{ color: Tk.textMuted, fontSize: 11, marginBottom: 8 }}>{t.dateFormat(n.ts)}</p>
                <p style={{ color: Tk.text, fontSize: 13, lineHeight: 1.65 }}>{n.text.length > 140 ? n.text.slice(0, 140) + "…" : n.text}</p>
              </Card>
            ))}
          </Section>
        )}

        {recentAttendance.length > 0 && (
          <Section title={t.recentClasses}>
            {recentAttendance.map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${Tk.border}`, alignItems: "center" }}>
                <span style={{ color: Tk.textMuted, fontSize: 13 }}>{t.dateFormat(a.date)}</span>
                <span style={{ color: Tk.text, fontSize: 13, fontWeight: 500 }}>{a.className}</span>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────
function Schedule({ student, classes, attendance, onRegister, onUnregister }) {
  const { t } = useLang();
  const [selected, setSelected] = useState(null);
  const enrolled = student.assignedClasses || [];
  const active = classes.filter((c) => !c.archived && enrolled.includes(c.id));

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <h2 style={{ color: Tk.text, fontFamily: SERIF, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.classSchedule}</h2>
      <p style={{ color: Tk.textMuted, fontSize: 13, marginBottom: 24 }}>{t.browseClasses}</p>

      {active.map((c) => {
        const isEnrolled = enrolled.includes(c.id);
        const myCount = attendance.filter((a) => a.classId === c.id).length;
        return (
          <Card key={c.id} style={{ marginBottom: 14 }} onClick={() => setSelected(selected?.id === c.id ? null : c)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  <h3 style={{ color: Tk.text, fontSize: 16, fontWeight: 700 }}>{c.name}</h3>
                  {isEnrolled && <Chip color={Tk.green}>{t.enrolled}</Chip>}
                </div>
                <p style={{ color: Tk.textMuted, fontSize: 13, marginBottom: 4 }}>
                  {t.days[DAYS_EN.indexOf(c.day)]} · {c.time}
                </p>
                <p style={{ color: Tk.textDim, fontSize: 12 }}>
                  ₪{c.pricePerClass}{t.perClass} · {t.next}: {nextOccurrence(c.day, t)}
                </p>
              </div>
              <span style={{ color: Tk.textMuted, fontSize: 18, marginTop: 2 }}>{selected?.id === c.id ? "▾" : "▸"}</span>
            </div>

            {selected?.id === c.id && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${Tk.border}` }} onClick={(e) => e.stopPropagation()}>
                {myCount > 0 && <p style={{ color: Tk.textMuted, fontSize: 12, marginBottom: 14 }}>{t.sessionsAttended(myCount)}</p>}
                {isEnrolled ? (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Chip color={Tk.green} style={{ padding: "6px 14px" }}>{t.youreEnrolled}</Chip>
                    <Btn variant="ghost" size="sm" onClick={() => onUnregister(c.id)}>{t.unenroll}</Btn>
                  </div>
                ) : (
                  <Btn variant="primary" onClick={() => onRegister(c.id)}>{t.registerClass}</Btn>
                )}
              </div>
            )}
          </Card>
        );
      })}
      {active.length === 0 && <p style={{ color: Tk.textMuted, fontSize: 15, textAlign: "center", marginTop: 40 }}>{t.noClasses}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTES
// ─────────────────────────────────────────────────────────────────────────────
function Notes({ notes }) {
  const { t } = useLang();
  const sorted = [...notes].sort((a, b) => b.ts.localeCompare(a.ts));

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <h2 style={{ color: Tk.text, fontFamily: SERIF, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.teacherNotes}</h2>
      <p style={{ color: Tk.textMuted, fontSize: 13, marginBottom: 24 }}>{t.feedbackDesc}</p>

      {sorted.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <p style={{ color: Tk.textMuted, fontSize: 15 }}>{t.noNotes}</p>
        </div>
      )}

      {sorted.map((n, i) => (
        <Card key={n.id} style={{
          marginBottom: 14,
          borderLeft: t.dir === "ltr" ? `3px solid ${i === 0 ? Tk.gold : Tk.purple}` : "none",
          borderRight: t.dir === "rtl" ? `3px solid ${i === 0 ? Tk.gold : Tk.purple}` : "none",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ color: i === 0 ? Tk.gold : Tk.purple, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>
              {i === 0 ? t.latest : t.note}
            </span>
            <span style={{ color: Tk.textMuted, fontSize: 12 }}>{t.dateFormat(n.ts)}</span>
          </div>
          <p style={{ color: Tk.text, fontSize: 14, lineHeight: 1.7 }}>{n.text}</p>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────
function Payments({ student, classes, attendance, payments, onPayNow }) {
  const { t } = useLang();
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  const rows = months.map((mk) => ({
    mk,
    status: payments[`${student.id}-${mk}`]?.status || "unpaid",
    cost: calcMonthCost(attendance, classes, mk),
    sessions: attendance.filter((a) => a.date.startsWith(mk)).length,
  }));
  const outstanding = rows.filter((r) => r.status !== "paid");
  const totalOwed = outstanding.reduce((s, r) => (r.status === "unpaid" ? s + r.cost : s + Math.round(r.cost / 2)), 0);

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <h2 style={{ color: Tk.text, fontFamily: SERIF, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.payments}</h2>
      <p style={{ color: Tk.textMuted, fontSize: 13, marginBottom: 24 }}>{t.billingDesc}</p>

      {totalOwed > 0 && (
        <div style={{ background: `${Tk.accent}18`, border: `1px solid ${Tk.accent}44`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <p style={{ color: Tk.textMuted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{t.totalOutstanding}</p>
          <p style={{ color: Tk.accent, fontFamily: SERIF, fontSize: 32, fontWeight: 700, marginBottom: 16 }}>₪{totalOwed}</p>
          <Btn variant="primary" size="lg" onClick={() => onPayNow(totalOwed, t.totalOutstanding)}>{t.payViaStripe}</Btn>
          <p style={{ color: Tk.textDim, fontSize: 11, marginTop: 10 }}>{t.stripeSecure}</p>
        </div>
      )}

      <div style={{ background: Tk.card, border: `1px solid ${Tk.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${Tk.border}` }}>
          <p style={{ color: Tk.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{t.paymentHistory}</p>
        </div>
        {rows.map((r, i) => (
          <div key={r.mk} style={{ padding: "16px 18px", borderBottom: i < rows.length - 1 ? `1px solid ${Tk.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={{ color: Tk.text, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t.monthFormat(r.mk)}</p>
              <p style={{ color: Tk.textMuted, fontSize: 12 }}>{t.classesAttended(r.sessions)}</p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <p style={{ color: Tk.text, fontSize: 15, fontWeight: 700 }}>₪{r.cost}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {r.status === "paid" ? <Chip color={Tk.green}>✓ {t.paid}</Chip> : r.status === "partial" ? <Chip color={Tk.gold}>~ Partial</Chip> : <Chip color={Tk.danger}>{t.lang === "he" ? "לא שולם" : "Unpaid"}</Chip>}
                {r.status !== "paid" && <Btn size="sm" variant="outline" onClick={() => onPayNow(r.cost, t.monthFormat(r.mk))}>{t.pay || "Pay"}</Btn>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card style={{ marginTop: 20 }}>
        <p style={{ color: Tk.textMuted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>{t.howPricing}</p>
        <p style={{ color: Tk.textMuted, fontSize: 13, lineHeight: 1.7 }}>{t.pricingDesc(classes[0]?.pricePerClass || 40, CONFIG.MONTHLY_MINIMUM)}</p>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function Profile({ student, classes, attendance, onUpdate, onLogout }) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: student.name, phone: student.phone || "", emergencyContact: student.emergencyContact || "" });
  const [saved, setSaved] = useState(false);

  const myClasses = classes.filter((c) => student.assignedClasses?.includes(c.id));
  const totalSessions = attendance.length;
  const thisYear = attendance.filter((a) => a.date.startsWith(new Date().getFullYear().toString())).length;

  const handleSave = () => { onUpdate(form); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const infoRows = [
    ["📞", t.phone, student.phone || "—"],
    ["✉️", t.emailLabel, student.email],
    ["🎂", t.birthday, student.birthday || "—"],
    ["📅", t.memberSince, student.joinDate ? t.dateFormat(student.joinDate) : "—"],
    ["🆘", t.emergencyContact, student.emergencyContact || "—"],
  ];

  return (
    <div style={{ padding: "20px 20px 100px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Avatar name={student.name} size={80} />
        <h2 style={{ color: Tk.text, fontFamily: SERIF, fontSize: 24, fontWeight: 700, marginTop: 14, marginBottom: 4 }}>{student.name}</h2>
        <p style={{ color: Tk.textMuted, fontSize: 14 }}>{student.email}</p>
        {saved && <p style={{ color: Tk.green, fontSize: 13, marginTop: 8 }}>{t.profileUpdated}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
        {[
          { label: t.classesEnrolled, value: myClasses.length },
          { label: t.sessionsThisYear, value: thisYear },
          { label: t.totalSessions, value: totalSessions },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: Tk.card, border: `1px solid ${Tk.border}`, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
            <p style={{ color: Tk.text, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{value}</p>
            <p style={{ color: Tk.textMuted, fontSize: 11, lineHeight: 1.4, whiteSpace: "pre-line" }}>{label}</p>
          </div>
        ))}
      </div>

      {!editing ? (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
            <p style={{ color: Tk.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{t.personalInfo}</p>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(true)}>{t.edit}</Btn>
          </div>
          {infoRows.map(([icon, label, value]) => (
            <div key={label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${Tk.border}` }}>
              <span style={{ fontSize: 16, width: 22, flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ color: Tk.textMuted, fontSize: 11, marginBottom: 2 }}>{label}</p>
                <p style={{ color: Tk.text, fontSize: 14 }}>{value}</p>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ color: Tk.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 }}>{t.editProfile}</p>
          <Input label={t.name} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label={t.phone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder={t.phonePlaceholder} />
          <Input label={t.emergencyContact} value={form.emergencyContact} onChange={(v) => setForm({ ...form, emergencyContact: v })} placeholder={t.emergencyPlaceholder} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="primary" onClick={handleSave}>{t.saveChanges}</Btn>
            <Btn variant="ghost" onClick={() => setEditing(false)}>{t.cancel}</Btn>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 24 }}>
        <p style={{ color: Tk.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>{t.myClasses}</p>
        {myClasses.length === 0 && <p style={{ color: Tk.textMuted, fontSize: 14 }}>{t.notEnrolledClasses}</p>}
        {myClasses.map((c) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${Tk.border}` }}>
            <div>
              <p style={{ color: Tk.text, fontSize: 14, fontWeight: 500 }}>{c.name}</p>
              <p style={{ color: Tk.textMuted, fontSize: 12 }}>{t.days[DAYS_EN.indexOf(c.day)]} · {c.time}</p>
            </div>
            <Chip color={Tk.green}>{t.active}</Chip>
          </div>
        ))}
      </Card>

      <Btn variant="ghost" style={{ width: "100%", justifyContent: "center", color: Tk.danger, borderColor: Tk.danger + "44" }} onClick={onLogout}>
        {t.signOut}
      </Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PaymentModal({ amount, description, onClose, onSuccess }) {
  const { t } = useLang();
  const [step, setStep] = useState("confirm");
  const [error, setError] = useState("");

  const handlePay = async () => {
    setStep("processing");
    try {
      await new Promise((r) => setTimeout(r, 1800));
      setStep("done");
      setTimeout(onSuccess, 1000);
    } catch {
      setError(t.paymentFailed);
      setStep("confirm");
    }
  };

  return (
    <BottomSheet title={t.payment} onClose={onClose}>
      {step === "confirm" && (
        <>
          <div style={{ background: Tk.card, border: `1px solid ${Tk.border}`, borderRadius: 14, padding: 20, marginBottom: 24, textAlign: "center" }}>
            <p style={{ color: Tk.textMuted, fontSize: 13, marginBottom: 6 }}>{description}</p>
            <p style={{ color: Tk.text, fontFamily: SERIF, fontSize: 38, fontWeight: 700 }}>₪{amount}</p>
          </div>
          {error && <p style={{ color: Tk.danger, fontSize: 13, marginBottom: 16 }}>{error}</p>}
          {!CONFIG.STRIPE_PUBLISHABLE_KEY && (
            <div style={{ background: Tk.goldDim, border: `1px solid ${Tk.gold}44`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
              <p style={{ color: Tk.gold, fontSize: 12, lineHeight: 1.6 }}>{t.demoStripe}</p>
            </div>
          )}
          <Btn variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }} onClick={handlePay}>
            💳 {CONFIG.STRIPE_PUBLISHABLE_KEY ? t.paySecurely : t.simulatePayment}
          </Btn>
          <p style={{ color: Tk.textDim, fontSize: 11, textAlign: "center", marginTop: 14 }}>{t.stripeEncryption}</p>
        </>
      )}
      {step === "processing" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
          <p style={{ color: Tk.text, fontSize: 15 }}>{t.processingPayment}</p>
        </div>
      )}
      {step === "done" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <p style={{ color: Tk.green, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{t.paymentConfirmed}</p>
          <p style={{ color: Tk.textMuted, fontSize: 14 }}>{t.received(amount)}</p>
        </div>
      )}
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
function BottomNav({ active, onChange, payAlert }) {
  const { t } = useLang();
  const nav = [
    { id: "dashboard", icon: "⊞", label: t.home },
    { id: "schedule",  icon: "📅", label: t.classes },
    { id: "notes",     icon: "📝", label: t.notes },
    { id: "payments",  icon: "💳", label: t.pay },
    { id: "profile",   icon: "👤", label: t.profile },
  ];
  const items = t.dir === "rtl" ? [...nav].reverse() : nav;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: Tk.surface, borderTop: `1px solid ${Tk.border}`,
      display: "flex", backdropFilter: "blur(12px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      direction: t.dir,
    }}>
      {items.map((n) => {
        const isActive = active === n.id;
        return (
          <button key={n.id} onClick={() => onChange(n.id)}
            style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              padding: "10px 4px 12px", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, position: "relative",
            }}>
            <span style={{ fontSize: 20, opacity: isActive ? 1 : 0.45 }}>{n.icon}</span>
            <span style={{ fontSize: 10, color: isActive ? Tk.accent : Tk.textMuted, fontWeight: isActive ? 700 : 400, fontFamily: FONT }}>{n.label}</span>
            {isActive && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 24, height: 2, borderRadius: 1, background: Tk.accent }} />}
            {n.id === "payments" && payAlert && <div style={{ position: "absolute", top: 6, right: "calc(50% - 14px)", width: 8, height: 8, borderRadius: "50%", background: Tk.accent, border: `2px solid ${Tk.surface}` }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
function Header({ title }) {
  const { t } = useLang();
  return (
    <div style={{ padding: "20px 20px 0", borderBottom: `1px solid ${Tk.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 }}>
        <h1 style={{ color: Tk.text, fontFamily: SERIF, fontSize: 22, fontWeight: 700 }}>{title}</h1>
        <LangToggle compact />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentApp() {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem("sup_lang") || "he"; } catch { return "he"; }
  });
  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem("sup_lang", l); } catch {}
  };
  const t = TRANSLATIONS[lang];

  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sup_student_auth")) || null; } catch { return null; }
  });
  const [screen, setScreen] = useState("dashboard");
  const [studioData, setStudioData] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [payModal, setPayModal] = useState(null);

  useEffect(() => {
    if (auth) localStorage.setItem("sup_student_auth", JSON.stringify(auth));
    else localStorage.removeItem("sup_student_auth");
  }, [auth]);

  const loadData = useCallback(async () => {
    setSyncing(true);
    if (CONFIG.GAS_URL) {
      const data = await GAS.getStudioData();
      if (data) setStudioData(data);
    } else {
      setStudioData({
        classes: DEMO_CLASSES, students: [DEMO_STUDENT],
        attendance: { s1: DEMO_ATTENDANCE }, notes: { s1: DEMO_NOTES }, payments: DEMO_PAYMENTS,
      });
    }
    setSyncing(false);
  }, []);

  useEffect(() => { if (auth) loadData(); }, [auth, loadData]);

  const student = studioData ? studioData.students?.find((s) => s.id === auth?.id) || auth : auth;
  const myAttendance = studioData ? studioData.attendance?.[auth?.id] || [] : [];
  const myNotes = studioData ? studioData.notes?.[auth?.id] || [] : [];
  const classes = studioData?.classes || DEMO_CLASSES;
  const payments = studioData?.payments || DEMO_PAYMENTS;
  const rsvps = studioData?.rsvps || {};

  const ctxValue = { lang, t: { ...t, lang }, setLang };

  const globalStyles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${Tk.bg}; }
    @keyframes sheetIn { from { transform: translateY(100%) } to { transform: translateY(0) } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
    @keyframes spin { to { transform: rotate(360deg) } }
    ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-thumb { background: ${Tk.border}; border-radius: 2px }
  `;

  if (!auth) {
    return (
      <LangContext.Provider value={ctxValue}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet" />
        <style>{globalStyles}</style>
        <AuthScreen onLogin={(s) => setAuth(s)} />
      </LangContext.Provider>
    );
  }

  if (!studioData) {
    return (
      <LangContext.Provider value={ctxValue}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
        <style>{globalStyles}</style>
        <div dir={t.dir} style={{ minHeight: "100vh", background: Tk.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, animation: "spin 1s linear infinite", marginBottom: 20, display: "inline-block" }}>⟳</div>
            <p style={{ color: Tk.textMuted, fontSize: 15 }}>{t.loadingClasses}</p>
          </div>
        </div>
      </LangContext.Provider>
    );
  }

  const payAlert = Object.keys(payments).some((k) => k.startsWith(auth.id) && payments[k].status !== "paid");
  const screenTitles = {
    schedule: t.classSchedule,
    notes: t.teacherNotes,
    payments: t.payments,
    profile: t.myProfile,
  };

  return (
    <LangContext.Provider value={ctxValue}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet" />
      <style>{globalStyles}</style>

      <div dir={t.dir} style={{ minHeight: "100vh", background: Tk.bg, fontFamily: FONT, maxWidth: 480, margin: "0 auto", position: "relative" }}>
        <div style={{ minHeight: "100vh", animation: "fadeUp 0.3s ease" }} key={`${screen}-${lang}`}>
          {screen === "dashboard" && (
            <Dashboard student={student} classes={classes} attendance={myAttendance}
              notes={myNotes} payments={payments} rsvps={rsvps}
              onNavigate={setScreen} onSync={loadData} syncing={syncing}
              onRsvp={async (classId, date, status) => {
               // עדכון מיידי בממשק
              const key = `${auth.id}-${classId}-${date}`;
  setStudioData(prev => ({
    ...prev,
    rsvps: {
      ...(prev?.rsvps || {}),
      [key]: { status, updatedAt: new Date().toISOString() }
    }
  }));
  // שמירה ברקע
  GAS.rsvp(auth.id, classId, date, status);
}} />
          )}
          {screen === "schedule" && (
            <><Header title={screenTitles.schedule} />
            <Schedule student={student} classes={classes} attendance={myAttendance}
              onRegister={async (cid) => { await GAS.registerClass(auth.id, cid); await loadData(); }}
              onUnregister={async (cid) => { await GAS.unregisterClass(auth.id, cid); await loadData(); }} /></>
          )}
          {screen === "notes" && (
            <><Header title={screenTitles.notes} /><Notes notes={myNotes} /></>
          )}
          {screen === "payments" && (
            <><Header title={screenTitles.payments} />
            <Payments student={student} classes={classes} attendance={myAttendance}
              payments={payments} onPayNow={(amount, desc) => setPayModal({ amount, description: desc })} /></>
          )}
          {screen === "profile" && (
            <><Header title={screenTitles.profile} />
            <Profile student={student} classes={classes} attendance={myAttendance}
              onUpdate={async (data) => { await GAS.updateProfile(auth.id, data); setAuth({ ...auth, ...data }); }}
              onLogout={() => { setAuth(null); setStudioData(null); }} /></>
          )}
        </div>

        <BottomNav active={screen} onChange={setScreen} payAlert={payAlert} />

        {payModal && (
          <PaymentModal amount={payModal.amount} description={payModal.description}
            onClose={() => setPayModal(null)}
            onSuccess={async () => {
              await GAS.logPayment(auth.id, payModal.amount, payModal.description, "stripe_demo");
              setPayModal(null);
              await loadData();
            }} />
        )}
      </div>
    </LangContext.Provider>
  );
}
