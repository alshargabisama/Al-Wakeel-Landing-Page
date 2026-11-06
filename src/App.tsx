import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Volume2, VolumeX, MapPin, MessageCircle, Shield, ArrowRight, ExternalLink } from 'lucide-react';

interface GoldPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  type: 'coin' | 'bar';
  scale: number;
  opacity: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  step: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phoneTargetRef = useRef<HTMLDivElement | null>(null);
 const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const synthRef = useRef<Tone.PolySynth | null>(null);

  // إعداد الصوت السينمائي الهادئ
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.22, sustain: 0.01, release: 0.2 },
    }).toDestination();
    synthRef.current.volume.value = -18;

    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const playChime = () => {
    if (!soundEnabled || !synthRef.current) return;
    try {
      const notes = ['F#6', 'A6', 'C#7', 'E7'];
      const note = notes[Math.floor(Math.random() * notes.length)];
      synthRef.current.triggerAttackRelease(note, '32n');
    } catch {
      // Audio fallback
    }
  };

  // محرك تساقط وانجذاب الذهب
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let pieces: GoldPiece[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnPiece = (initialY?: number): GoldPiece => {
      const isBar = Math.random() > 0.6;
      return {
        x: Math.random() * canvas.width,
        y: initialY ?? -60,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.2 + Math.random() * 2,
        size: isBar ? 26 : 18,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.035,
        type: isBar ? 'bar' : 'coin',
        scale: 0.75 + Math.random() * 0.45,
        opacity: 0.85 + Math.random() * 0.15,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        wobbleAmp: 1.2 + Math.random() * 1.8,
        step: Math.random() * 100,
      };
    };

    for (let i = 0; i < 26; i++) {
      pieces.push(spawnPiece(Math.random() * canvas.height));
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let targetX = canvas.width / 2;
      let targetY = canvas.height * 0.46;

      if (phoneTargetRef.current) {
        const rect = phoneTargetRef.current.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.step += p.wobbleSpeed;

        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 460) {
          const attraction = (460 - dist) / 460;
          p.vx += (dx / dist) * attraction * 0.65;
          p.vy += (dy / dist) * attraction * 0.65;
        } else {
          p.x += Math.sin(p.step) * p.wobbleAmp;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (dist < 32) {
          playChime();
          pieces.splice(i, 1);
          pieces.push(spawnPiece());
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = p.opacity;

        if (p.type === 'coin') {
          const grad = ctx.createRadialGradient(-p.size * 0.2, -p.size * 0.2, p.size * 0.1, 0, 0, p.size);
          grad.addColorStop(0, '#FFF5BA');
          grad.addColorStop(0.35, '#E5B842');
          grad.addColorStop(0.85, '#AD7E14');
          grad.addColorStop(1, '#5C4004');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FDE68A';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(92, 64, 4, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          ctx.fillStyle = '#4D3603';
          ctx.font = 'bold 8.5px IBM Plex Sans Arabic';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('21K', 0, -2);
          ctx.font = '7px IBM Plex Sans Arabic';
          ctx.fillText('الوكيل', 0, 7);
        } else {
          const w = p.size * 1.9;
          const h = p.size * 1.1;

          const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
          grad.addColorStop(0, '#FFF8CA');
          grad.addColorStop(0.28, '#E5B842');
          grad.addColorStop(0.72, '#9E7110');
          grad.addColorStop(1, '#523702');

          ctx.fillStyle = grad;
          ctx.fillRect(-w / 2, -h / 2, w, h);

          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 1;
          ctx.strokeRect(-w / 2, -h / 2, w, h);

          ctx.strokeStyle = 'rgba(82, 55, 2, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);

          ctx.fillStyle = '#3B2702';
          ctx.font = 'bold 8px IBM Plex Sans Arabic';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('24K 999.9', 0, -3);
          ctx.font = '6px IBM Plex Sans Arabic';
          ctx.fillText('AL-WAKEEL', 0, 5);
        }

        ctx.restore();

        if (p.y > canvas.height + 60 || p.x < -60 || p.x > canvas.width + 60) {
          pieces[i] = spawnPiece();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [soundEnabled]);

  const toggleSound = () => {
    Tone.start();
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        backgroundColor: '#09090B',
        backgroundImage: 'radial-gradient(circle at 50% 28%, #161618 0%, #09090B 80%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        overflow: showPrivacy ? 'auto' : 'hidden',
        direction: 'rtl',
      }}
    >
      {/* خلفية الكانفاس التفاعلية */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* 1. الترويسة العلوية */}
      <header
        style={{
          width: '100%',
          maxWidth: 960,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 13,
              border: '1.8px solid #D4AF37',
              boxShadow: '0 0 12px rgba(212, 175, 55, 0.25)',
              overflow: 'hidden',
              backgroundColor: '#09090B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src="/al-wakeel-logo.jpg"
              alt="شعار مجوهرات الوكيل بنك الذهب"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#EDEDED', margin: 0, letterSpacing: '-0.2px' }}>
              مجوهرات الوكيل بنك الذهب
            </h1>
            <p style={{ fontSize: 12, color: '#E5B842', fontWeight: 600, margin: '2px 0 0 0' }}>
              تعز • شارع 26 سبتمبر
            </p>
          </div>
        </div>

        <button
          onClick={toggleSound}
          title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت الرنين'}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: soundEnabled ? 'rgba(229, 184, 66, 0.12)' : '#161618',
            border: soundEnabled ? '1px solid #E5B842' : '1px solid #27272A',
            color: soundEnabled ? '#E5B842' : '#A1A1AA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </header>

      {/* 2. المحتوى الرئيسي أو صفحة سياسة الخصوصية عند فتحها */}
      {!showPrivacy ? (
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            margin: 'auto 0',
            width: '100%',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(22px, 3.8vw, 32px)',
              fontWeight: 800,
              color: '#EDEDED',
              textAlign: 'center',
              marginBottom: 24,
              letterSpacing: '-0.3px',
            }}
          >
            احصل على <span style={{ color: '#E5B842' }}>بنك الذهب</span> في هاتفك
          </h2>

          {/* مجسم الهاتف */}
          <div
            style={{
              width: 250,
              height: 450,
              borderRadius: 48,
              border: '6px solid #27272A',
              backgroundColor: '#09090B',
              backgroundImage: 'radial-gradient(circle at 50% 25%, #18181B 0%, #09090B 85%)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
              padding: '18px 14px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 14,
                width: 72,
                height: 18,
                backgroundColor: '#000000',
                borderRadius: 12,
                zIndex: 3,
              }}
            />

            <div
              ref={phoneTargetRef}
              className="gold-app-glow"
              style={{
                width: 92,
                height: 92,
                borderRadius: 22,
                overflow: 'hidden',
                border: '1.8px solid #D4AF37',
                boxShadow: '0 0 16px rgba(212, 175, 55, 0.35)',
                cursor: 'pointer',
                backgroundColor: '#09090B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="/al-wakeel-logo.jpg"
                alt="تطبيق مجوهرات الوكيل بنك الذهب"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <p style={{ marginTop: 14, fontSize: 14, fontWeight: 800, color: '#EDEDED', textAlign: 'center' }}>
              مجوهرات الوكيل بنك الذهب
            </p>
            <span style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 500, marginTop: 2, textAlign: 'center' }}>
              أسعار الذهب والعيارات اللحظية بتعز
            </span>

            <div
              style={{
                position: 'absolute',
                bottom: 12,
                width: 90,
                height: 4,
                backgroundColor: '#27272A',
                borderRadius: 2,
              }}
            />
          </div>

          {/* أزرار التحميل */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 26,
              width: '100%',
              maxWidth: 440,
              justifyContent: 'center',
            }}
          >
            <a
              href="https://play.google.com/store/apps"
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                backgroundColor: '#161618',
                color: '#EDEDED',
                border: '1px solid #27272A',
                textDecoration: 'none',
                padding: '11px 14px',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4CAF50" d="M3.6 1.8l10.9 10.2-10.9 10.2z"/>
                <path fill="#FFC107" d="M14.5 12l3.4-3.2-3.4-3.2z"/>
                <path fill="#FF3D00" d="M3.6 1.8l14.3 7-3.4 3.2z"/>
                <path fill="#1976D2" d="M3.6 22.2l14.3-7-3.4-3.2z"/>
              </svg>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: 10, color: '#A1A1AA' }}>تحميل للأندرويد</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#EDEDED' }}>Google Play</span>
              </div>
            </a>

            <a
              href="https://www.apple.com/app-store/"
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1,
                backgroundColor: '#161618',
                color: '#EDEDED',
                border: '1px solid #27272A',
                textDecoration: 'none',
                padding: '11px 14px',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="#EDEDED">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.01.63-2.65 1.39-.56.65-.99 1.69-.86 2.73 1.05.08 2.06-.52 2.59-1.25z"/>
              </svg>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: 10, color: '#A1A1AA' }}>تحميل للآيفون</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#EDEDED' }}>App Store</span>
              </div>
            </a>
          </div>
        </main>
      ) : (
        /* صفحة سياسة الخصوصية الرسمية المتوافقة مع جوجل بلاي */
        <main
          style={{
            zIndex: 10,
            width: '100%',
            maxWidth: 760,
            backgroundColor: '#121215',
            border: '1px solid #27272A',
            borderRadius: 20,
            padding: '30px 24px',
            margin: '40px auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            textAlign: 'right',
          }}
        >
          <button
            onClick={() => setShowPrivacy(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#E5B842',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            <ArrowRight size={18} />
            <span>العودة للرئيسية</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Shield size={24} color="#E5B842" />
            <h2 style={{ fontSize: 22, color: '#EDEDED', margin: 0 }}>سياسة الخصوصية - بنك الذهب</h2>
          </div>
          <p style={{ fontSize: 13, color: '#A1A1AA', marginBottom: 24 }}>آخر تحديث: نوفمبر 2026</p>

          <div style={{ color: '#D4D4D8', fontSize: 14, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>
              تلتزم <strong>مجوهرات الوكيل بنك الذهب</strong> بحماية خصوصيتك ومعلوماتك. توضح سياسة الخصوصية هذه كيف نتعامل مع بياناتك عند استخدامك لتطبيقنا المصمم لعرض أسعار الذهب والعيارات والقطع اللحظية في تعز.
            </p>

            <h3 style={{ fontSize: 16, color: '#E5B842', marginTop: 10 }}>1. جمع البيانات واستخدامها</h3>
            <p>
              تطبيقنا مصمم للعمل بشكل مستقل وآمن؛ نحن <strong>لا نقوم بجمع أو تخزين أي بيانات شخصية حساسة</strong> من المستخدمين (مثل الأسماء، أرقام الهواتف، أو بيانات الحسابات البنكية). التطبيق يعرض الأسعار المحلية والعالمية وميزات العرض والمسابقات دون الحاجة لإنشاء حسابات أو تتبع المواقع.
            </p>

            <h3 style={{ fontSize: 16, color: '#E5B842', marginTop: 10 }}>2. الإشعارات والاتصال المباشر</h3>
            <p>
              يتم إرسال إشعارات التحديثات الفورية للأسعار بشكل مباشر دون تخزين أي سجلات للإشعارات في قواعد بيانات خارجية، حفاظاً تاماً على الخصوصية. التواصل مع المتجر يتم اختيارياً عبر قنواتنا الرسمية (واتساب أو وسائل التواصل).
            </p>

            <h3 style={{ fontSize: 16, color: '#E5B842', marginTop: 10 }}>3. أمان البيانات</h3>
            <p>
              نحن نتخذ كافة التدابير التقنية المناسبة لضمان أمان التطبيق وحمايته ضد أي وصول غير autorizado، مع الالتزام التام بسياسات متجر Google Play.
            </p>

            <h3 style={{ fontSize: 16, color: '#E5B842', marginTop: 10 }}>4. اتصل بنا</h3>
            <p>
              إذا كان لديك أي استفسار بخصوص سياسة الخصوصية أو التطبيق، يمكنك التواصل معنا عبر الفرع الرئيسي في تعز - شارع 26 سبتمبر أو عبر أزرار التواصل المتاحة في الصفحة الرئيسية.
            </p>
          </div>
        </main>
      )}

      {/* 3. الشريط السفلي */}
      <footer
        style={{
          width: '100%',
          maxWidth: 960,
          borderTop: '1px solid #27272A',
          paddingTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
        }}
      >
        <a
          href="https://maps.google.com"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#A1A1AA',
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <MapPin size={15} color="#E5B842" />
          <span>الفرع الرئيسي: تعز - شارع 26 سبتمبر</span>
        </a>

        {/* زر سياسة الخصوصية داخل التطبيق */}
        <button
          onClick={() => setShowPrivacy(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#E5B842',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: 0,
          }}
        >
          <ExternalLink size={14} />
          <span>سياسة الخصوصية</span>
        </button>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a
            href="https://wa.me/967738753741"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
          >
            <MessageCircle size={17} />
            <span>واتساب</span>
          </a>
          <a
            href="https://www.instagram.com/alwakeelgoldbank"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#A1A1AA', display: 'flex', alignItems: 'center' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a
            href="https://www.facebook.com/share/1AMTa2bFfV/"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#A1A1AA', display: 'flex', alignItems: 'center' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}