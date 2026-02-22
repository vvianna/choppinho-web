import { useState, useEffect, useRef } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronRight,
  Flame,
  Lock,
  Menu,
  MessageCircle,
  Share2,
  Smartphone,
  Timer,
  Trophy,
  X,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Intersection Observer hook
   ───────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─────────────────────────────────────────────
   Section wrapper with fade-in
   ───────────────────────────────────────────── */
function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
    >
      {children}
    </section>
  );
}

/* ═════════════════════════════════════════════
   LANDING PAGE
   ═════════════════════════════════════════════ */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navLinks = [
    { label: "Funcionalidades", href: "#features" },
    { label: "Como funciona", href: "#how" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Grain texture */}
      <div className="grain-overlay" />

      {/* ──── NAVBAR ──── */}
      <nav
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled
          ? "bg-cream/90 backdrop-blur-md shadow-lg shadow-primary/5 border-b border-primary/10"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-20">
          <a href="#" className="flex items-center gap-2 sm:gap-3 group">
            <img
              src="/choppinho-mascot.png"
              alt="Choppinho"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary/30 group-hover:scale-110 transition-transform object-cover mix-blend-multiply"
            />
            <span className="font-display font-bold text-xl sm:text-2xl text-primary">
              Choppinho<span className="text-accent">Fit</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-body font-semibold text-bark/70 hover:text-primary transition-colors text-sm"
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://wa.me/your-whatsapp-number"
              className="bg-primary text-white px-5 py-2.5 rounded-full font-display font-bold text-sm hover:bg-primary-600 transition-colors shadow-lg shadow-primary/20"
            >
              Comece grátis
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-primary p-2"
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-cream/95 backdrop-blur-md border-t border-primary/10 px-6 py-4 space-y-3 animate-fade-in">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block font-body font-semibold text-bark/80 py-2"
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://wa.me/your-whatsapp-number"
              onClick={() => setMenuOpen(false)}
              className="block bg-primary text-white text-center px-5 py-3 rounded-full font-display font-bold"
            >
              Comece grátis
            </a>
          </div>
        )}
      </nav>

      {/* ──── HERO ──── */}
      <header className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
          {/* Floating hop bubbles */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bubble-float absolute w-3 h-3 rounded-full bg-primary/15"
              style={{
                left: `${15 + i * 18}%`,
                bottom: `${10 + (i % 3) * 15}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full font-body font-semibold text-sm mb-6">
                <Zap size={14} />
                <span>Strava + WhatsApp + IA</span>
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-bark leading-tight">
                Seu parceiro de{" "}
                <span className="text-primary relative">
                  corrida
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M2 6C50 2 150 2 198 6" stroke="#F5B731" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                no bolso.
              </h1>

              <p className="mt-6 font-body text-lg sm:text-xl text-bark/70 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                O Choppinho conecta seu Strava ao WhatsApp e te entrega resumos semanais,
                análises de pace e motivação — tudo com a simpatia de quem entende que
                <span className="font-bold text-accent"> cada quilômetro conta</span>. 🍺🏃
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <a
                  href="https://wa.me/your-whatsapp-number"
                  className="bg-primary hover:bg-primary-600 text-white px-8 py-4 rounded-full font-display font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <MessageCircle size={20} />
                  Começar no WhatsApp
                </a>
                <a
                  href="#how"
                  className="text-primary font-body font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Como funciona
                  <ChevronRight size={18} />
                </a>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {["🏃", "🏃‍♀️", "🏃‍♂️", "🏃"].map((e, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-primary/10 border-2 border-cream flex items-center justify-center text-sm"
                    >
                      {e}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-body text-bark/60">
                  <span className="font-bold text-bark">100</span> corredores já conectados
                </p>
              </div>
            </div>

            {/* Mascot */}
            <div className="flex-1 flex justify-center relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/20 to-primary/20 rounded-full blur-3xl scale-75" />
                <img
                  src="/choppinho-mascot.png"
                  alt="Choppinho Fit mascote"
                  className="relative w-72 sm:w-80 lg:w-96 animate-float drop-shadow-2xl mix-blend-multiply"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ──── APP SCREENS ──── */}
      <Section className="py-12 sm:py-16 bg-gradient-to-b from-cream to-primary/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/15 border border-primary/10">
            <img
              src="/app-screens.png"
              alt="Telas do app Choppinho Fit"
              className="w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bark/20 to-transparent" />
          </div>
        </div>
      </Section>

      {/* ──── FEATURES ──── */}
      <Section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-accent/15 text-accent-600 px-4 py-1.5 rounded-full font-body font-bold text-sm mb-4">
              Funcionalidades
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-bark">
              Tudo que você precisa para{" "}
              <span className="text-primary">evoluir</span>
            </h2>
            <p className="mt-4 font-body text-bark/60 max-w-2xl mx-auto text-lg">
              Conecte, acompanhe e receba insights inteligentes sobre suas corridas, direto no WhatsApp.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 size={24} />,
                title: "Resumo Semanal",
                desc: "Receba automaticamente distância, pace, tempo e evolução da semana.",
                color: "bg-primary/10 text-primary",
              },
              {
                icon: <Activity size={24} />,
                title: "Integração Strava",
                desc: "Conecte em segundos e deixe o Choppinho acompanhar toda sua evolução.",
                color: "bg-orange-100 text-orange-600",
              },
              {
                icon: <Bot size={24} />,
                title: "Bot no WhatsApp",
                desc: "Consulte seus dados, receba resumos e motivação onde você já está.",
                color: "bg-green-100 text-green-700",
              },
              {
                icon: <Flame size={24} />,
                title: "Streak & Motivação",
                desc: "Acompanhe sua sequência semanal e mantenha a consistência em alta.",
                color: "bg-red-100 text-red-600",
              },
              {
                icon: <Timer size={24} />,
                title: "Análise de Pace",
                desc: "Evolução do pace médio ao longo das semanas com dicas personalizadas.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: <Lock size={24} />,
                title: "Privacidade Total",
                desc: "Seus dados são seus. Desconecte a qualquer momento e tudo é apagado.",
                color: "bg-purple-100 text-purple-600",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-bark mb-2">{f.title}</h3>
                <p className="font-body text-bark/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ──── HOW IT WORKS ──── */}
      <Section id="how" className="py-20 sm:py-28 bg-gradient-to-b from-primary/5 to-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full font-body font-bold text-sm mb-4">
              Como funciona
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-bark">
              Em <span className="text-accent">3 passos</span> simples
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Smartphone size={32} />,
                title: "Conecte o Strava",
                desc: "Autorize o Choppinho a ler seus dados de corrida. Processo rápido e seguro.",
              },
              {
                step: "02",
                icon: <MessageCircle size={32} />,
                title: "Abra o WhatsApp",
                desc: 'Acesse o bot do Choppinho Fit e mande um "oi". Ele já vai te conhecer!',
              },
              {
                step: "03",
                icon: <Trophy size={32} />,
                title: "Receba insights",
                desc: "Resumos semanais, análise de pace, streaks e motivação personalizada.",
              },
            ].map((s, i) => (
              <div key={i} className="relative text-center group">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-primary/5" />
                )}

                <div className="relative mx-auto w-28 h-28 rounded-full bg-white shadow-lg shadow-primary/10 border-2 border-primary/10 flex items-center justify-center mb-6 group-hover:border-primary/30 group-hover:shadow-xl transition-all">
                  <div className="text-primary">{s.icon}</div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-bark font-display font-bold text-xs flex items-center justify-center shadow-md">
                    {s.step}
                  </div>
                </div>

                <h3 className="font-display font-bold text-xl text-bark mb-3">{s.title}</h3>
                <p className="font-body text-bark/60 max-w-xs mx-auto leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ──── WHATSAPP PREVIEW ──── */}
      <Section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-primary to-primary-700 rounded-3xl p-8 sm:p-14 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-4">
                  Motivação no seu <span className="text-accent">WhatsApp</span>
                </h2>
                <p className="font-body text-white/80 text-lg mb-8 max-w-md mx-auto lg:mx-0">
                  Receba semanalmente um relatório completo com seus dados do Strava.
                  Consistência é chave, e cada quilômetro conta! 🎉
                </p>

                {/* Mock chat bubbles */}
                <div className="space-y-3 max-w-sm mx-auto lg:mx-0">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="font-body text-white/90 text-sm">
                      Fala, bora o resumo da semana? 📊
                    </p>
                  </div>
                  <div className="bg-accent/90 rounded-2xl rounded-tr-sm px-4 py-3 ml-8">
                    <p className="font-body text-bark text-sm font-semibold">
                      ✅ Distance: 32.30 km<br />
                      ✅ Runs: 4<br />
                      ✅ Duration: 3h 17min<br />
                      🟡 Avg Pace: 06:05/km
                    </p>
                    <p className="font-body text-bark/80 text-xs mt-2">
                      Great job this week! 🎉 Consistency is key!
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex justify-center">
                <img
                  src="/choppinho-mascot.png"
                  alt="Choppinho"
                  className="w-52 sm:w-64 drop-shadow-2xl animate-float mix-blend-multiply"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ──── SHARE TO WHATSAPP FEATURE ──── */}
      <Section className="py-16 sm:py-20 bg-gradient-to-b from-cream to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full font-body font-bold text-sm mb-6">
            <Share2 size={14} />
            <span>Compartilhe</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-bark mb-4">
            Mostre pro grupo da <span className="text-primary">corrida</span>
          </h2>
          <p className="font-body text-bark/60 text-lg max-w-xl mx-auto mb-8">
            Compartilhe seus resumos semanais direto no grupo do WhatsApp e motive a galera toda. 💪
          </p>
          <div className="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full font-display font-bold text-lg shadow-xl shadow-[#25D366]/25 hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-0.5">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share to WhatsApp
          </div>
        </div>
      </Section>



      {/* ──── FAQ ──── */}
      <Section id="faq" className="py-20 sm:py-28 bg-gradient-to-b from-primary/5 to-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full font-body font-bold text-sm mb-4">
              FAQ
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-bark">
              Perguntas <span className="text-accent">frequentes</span>
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Preciso de Strava para usar o Choppinho?",
                a: "Sim! O Choppinho se conecta ao Strava para acessar seus dados de corrida. Basta ter uma conta gratuita no Strava e autorizar a conexão.",
              },
              {
                q: "Meus dados ficam seguros?",
                a: "Totalmente. Armazenamos apenas os dados necessários para gerar seus resumos. Você pode desconectar a qualquer momento e todos os dados serão apagados imediatamente.",
              },
              {
                q: "Funciona com caminhada e ciclismo?",
                a: "Atualmente o Choppinho é focado em corrida, mas estamos trabalhando para incluir outras atividades em breve!",
              },
              {
                q: "Posso cancelar a qualquer momento?",
                a: "Sim! Sem multa, sem fidelidade. Cancele quando quiser e continue usando o plano gratuito.",
              },
              {
                q: "Como recebo os resumos no WhatsApp?",
                a: "Após conectar o Strava, basta abrir uma conversa com o bot do Choppinho Fit no WhatsApp. Ele envia resumos automaticamente toda segunda-feira.",
              },
              {
                q: "Quanto tempo leva para configurar?",
                a: "Menos de 2 minutos! Conecte o Strava, abra o WhatsApp e pronto — o Choppinho já começa a te acompanhar.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-primary/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 font-display font-bold text-bark text-left hover:bg-primary/5 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-primary shrink-0 ml-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 animate-fade-in">
                    <p className="font-body text-bark/60 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ──── CTA FINAL ──── */}
      <Section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <img
            src="/choppinho-mascot.png"
            alt="Choppinho"
            className="w-24 h-24 mx-auto mb-6 animate-float mix-blend-multiply"
          />
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-bark mb-4">
            Bora correr com o <span className="text-primary">Choppinho</span>?
          </h2>
          <p className="font-body text-bark/60 text-lg max-w-xl mx-auto mb-8">
            Conecte seu Strava, abra o WhatsApp e deixe o Choppinho cuidar do resto.
            Cada quilômetro conta! 🏃🍺
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-10 py-4 rounded-full font-display font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl transition-all hover:-translate-y-0.5"
          >
            <MessageCircle size={22} />
            Começar agora — é grátis
          </a>
        </div>
      </Section>

      {/* ──── FOOTER ──── */}
      <footer className="bg-bark text-white/60 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/choppinho-mascot.png"
                alt="Choppinho"
                className="w-10 h-10 rounded-full border border-white/10 bg-white/10 object-cover mix-blend-multiply"
              />
              <span className="font-display font-bold text-lg text-white">
                Choppinho<span className="text-accent">Fit</span>
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm font-body">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm font-body">
            <p>© {new Date().getFullYear()} Choppinho Fit. Todos os direitos reservados.</p>
            <p className="mt-1 text-white/40">
              Feito com 🍺 e muito ❤️ para corredores
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
