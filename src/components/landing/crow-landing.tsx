import type React from "react";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export function CrowLanding() {
  return (
    <div className="crowland">


<div className="hero-bg" aria-hidden="true">
  <div className="orb orb-1"></div>
  <div className="orb orb-2"></div>
  <div className="orb orb-3"></div>
</div>


<nav id="navbar">
  <div className="container nav-inner">
    <a href="#hero" className="brand"><img src="/crow-logo.png" alt="CROW" /> CROW</a>
    <div className="nav-links">
      <Link href="/marketplace">Marketplace</Link>
      <a href="#creator-studio">Creator Studio</a>
      <a href="#affiliates">Afiliados</a>
      <a href="#engine">Comisiones</a>
      <a href="#process">Cómo funciona</a>
      <a href="#pricing">Precios</a>
    </div>
    <div className="nav-actions">
      <Link href="/login" className="btn btn-ghost btn-sm">Iniciar sesión</Link>
      <Link href="/register" className="btn btn-primary btn-sm magnetic">Crear mi cuenta</Link>
    </div>
    <button className="nav-toggle" id="navToggle" aria-label="Abrir menú"><span></span></button>
  </div>
</nav>

<div className="mobile-menu" id="mobileMenu">
  <Link href="/marketplace">Marketplace</Link>
  <a href="#creator-studio">Creator Studio</a>
  <a href="#affiliates">Afiliados</a>
      <a href="#engine">Comisiones</a>
  <a href="#process">Cómo funciona</a>
  <a href="#pricing">Precios</a>
  <div className="nav-actions">
    <Link href="/login" className="btn btn-ghost">Iniciar sesión</Link>
    <Link href="/register" className="btn btn-primary">Crear mi cuenta gratis</Link>
  </div>
</div>


<section id="hero">
  <div className="grain-lines" aria-hidden="true"></div>
  <div className="container hero-inner">
    <div className="reveal" style={{transitionDelay: ".05s"}}>
      <span className="eyebrow">La nueva generación de creadores con IA</span>
    </div>
    <h1 className="hero-title reveal" style={{transitionDelay: ".15s"}}>
      <span className="g1">Creá.</span><span className="g2">Publicá.</span><span className="g3">Monetizá.</span>
    </h1>
    <p className="hero-sub reveal" style={{transitionDelay: ".3s"}}>CROW convierte una idea en un producto digital listo para vender, lo conecta con un marketplace global y te permite crecer con IA y afiliados.</p>
    <div className="hero-ctas reveal" style={{transitionDelay: ".42s"}}>
      <Link href="/register" className="btn btn-primary magnetic">Crear mi cuenta gratis →</Link>
      <Link href="/marketplace" className="btn btn-ghost">Explorar Marketplace</Link>
    </div>
    <div className="hero-indicators reveal" style={{transitionDelay: ".55s"}}>
      <span><b>✦</b>AI Creator Studio</span>
      <span><b>✦</b>Marketplace</span>
      <span><b>✦</b>Affiliate Network</span>
      <span><b>✦</b>Wallet</span>
    </div>
  </div>
</section>


<section id="product-surface">
  <div className="container">
    <div className="studio-frame reveal" id="studioFrame">
      <div className="studio-topbar">
        <div className="studio-dots"><i></i><i></i><i></i></div>
        <span className="studio-label">CROW Creator Studio</span>
        <span className="studio-tag">CREATED WITH CROW AI</span>
      </div>
      <div className="studio-body">
        <div className="studio-prompt-label">¿Qué querés crear?</div>
        <div className="studio-input">
          <span className="cursor-text" id="typeTarget"></span><span className="caret"></span>
        </div>
        <div className="studio-steps" id="studioSteps">
          <div className="studio-step"><span className="dotstate"></span>Analizando idea...</div>
          <div className="studio-step"><span className="dotstate"></span>Definiendo público...</div>
          <div className="studio-step"><span className="dotstate"></span>Construyendo estructura...</div>
          <div className="studio-step"><span className="dotstate"></span>Generando módulos...</div>
          <div className="studio-step"><span className="dotstate"></span>Creando ejercicios...</div>
          <div className="studio-step"><span className="dotstate"></span>Preparando recursos...</div>
          <div className="studio-step"><span className="dotstate"></span>Producto listo.</div>
        </div>
        <div className="studio-results" id="studioResults">
          <div className="chip">8 módulos</div>
          <div className="chip">32 lecciones</div>
          <div className="chip">Ejercicios interactivos</div>
          <div className="chip">Recursos descargables</div>
          <div className="chip">Certificado</div>
          <div className="chip">Landing comercial</div>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="process">
  <div className="container">
    <div className="section-head reveal">
      <span className="eyebrow">Cómo funciona</span>
      <h2>De una idea a un producto digital completo.</h2>
      <p>Sin empezar desde cero. Sin equipos enormes. Sin horas construyendo todo manualmente.</p>
    </div>
    <div className="process-grid reveal-stagger">
      <div className="process-item"><div className="process-num">01</div><h3>Idea</h3><p>Contale a CROW qué querés crear.</p></div>
      <div className="process-item"><div className="process-num">02</div><h3>Build</h3><p>La IA estructura y desarrolla tu producto.</p></div>
      <div className="process-item"><div className="process-num">03</div><h3>Launch</h3><p>Publicalo con una página comercial lista para vender.</p></div>
      <div className="process-item"><div className="process-num">04</div><h3>Grow</h3><p>Activá afiliados y hacé crecer tus ventas.</p></div>
    </div>
  </div>
</section>


<section id="creator-studio">
  <div className="container studio-layout">
    <div className="reveal">
      <span className="eyebrow">Creator Studio</span>
      <h2 style={{fontSize: "clamp(28px,3.6vw,40px)", marginTop: "14px"}}>Tu nueva fábrica de productos digitales.</h2>
      <p className="lede" style={{marginTop: "18px"}}>CROW Creator Studio combina inteligencia artificial, generación de contenido y herramientas de publicación en un solo lugar.</p>
      <div className="format-row">
        <span className="format-tag">Cursos</span>
        <span className="format-tag">Interactive Web</span>
        <span className="format-tag">PDF</span>
        <span className="format-tag">Ebook</span>
        <span className="format-tag">Resource Kit</span>
      </div>
      <Link href="/creator/studio" className="btn btn-ghost magnetic">Conocer Creator Studio →</Link>
      <div className="pill-grid">
        <span className="pill">AI Chat</span><span className="pill">Blueprint</span><span className="pill">Modules</span>
        <span className="pill">Lessons</span><span className="pill">Exercises</span><span className="pill">Images</span>
        <span className="pill">Videos</span><span className="pill">Resources</span><span className="pill">Certificate</span>
        <span className="pill">Preview</span><span className="pill">Publish</span>
      </div>
    </div>
    <div className="reveal" style={{transitionDelay: ".1s"}}>
      <div className="flow-card">
        <div className="flow-row"><span className="flow-dot"></span><span>AI Chat</span><small>Definiendo objetivo</small></div>
        <div className="flow-row"><span className="flow-dot"></span><span>Blueprint</span><small>Estructura lista</small></div>
        <div className="flow-row"><span className="flow-dot"></span><span>Modules & Lessons</span><small>8 módulos</small></div>
        <div className="flow-row"><span className="flow-dot"></span><span>Exercises</span><small>Generados</small></div>
        <div className="flow-row"><span className="flow-dot"></span><span>Images & Videos</span><small>En proceso</small></div>
        <div className="flow-row"><span className="flow-dot"></span><span>Certificate</span><small>Configurado</small></div>
        <div className="flow-row"><span className="flow-dot"></span><span>Publish</span><small>Listo para vender</small></div>
      </div>
    </div>
  </div>
</section>


<section id="marketplace">
  <div className="container">
    <div className="section-head reveal">
      <span className="eyebrow">Marketplace</span>
      <h2>Un marketplace construido para la nueva economía digital.</h2>
      <p>Descubrí productos digitales creados por personas reales y potenciados por inteligencia artificial.</p>
    </div>
  </div>
  <div className="container">
    <div className="mkt-scroll reveal">
      <div className="mkt-card">
        <div className="mkt-cover g1"><span className="mkt-cat">IA & Ventas</span></div>
        <div className="mkt-info">
          <h4>AI Sales Mastery</h4>
          <div className="mkt-creator">por Lucía Fernández</div>
          <div className="mkt-foot"><span className="mkt-rating">★ 4.9</span><span className="mkt-price">45 USDT</span></div>
        </div>
      </div>
      <div className="mkt-card">
        <div className="mkt-cover g2"><span className="mkt-cat">Negocios</span></div>
        <div className="mkt-info">
          <h4>Creator Business OS</h4>
          <div className="mkt-creator">por Martín Rossi</div>
          <div className="mkt-foot"><span className="mkt-rating">★ 4.8</span><span className="mkt-price">60 USDT</span></div>
        </div>
      </div>
      <div className="mkt-card">
        <div className="mkt-cover g3"><span className="mkt-cat">IA & Prompting</span></div>
        <div className="mkt-info">
          <h4>Prompt Engineering Pro</h4>
          <div className="mkt-creator">por Sofía Almada</div>
          <div className="mkt-foot"><span className="mkt-rating">★ 5.0</span><span className="mkt-price">38 USDT</span></div>
        </div>
      </div>
      <div className="mkt-card">
        <div className="mkt-cover g4"><span className="mkt-cat">Marketing</span></div>
        <div className="mkt-info">
          <h4>Digital Marketing Lab</h4>
          <div className="mkt-creator">por Diego Torres</div>
          <div className="mkt-foot"><span className="mkt-rating">★ 4.7</span><span className="mkt-price">52 USDT</span></div>
        </div>
      </div>
    </div>
    <Link href="/marketplace" className="btn btn-ghost magnetic reveal">Explorar Marketplace →</Link>
  </div>
</section>


<section id="affiliates">
  <div className="container aff-layout">
    <div className="reveal">
      <span className="eyebrow">Affiliate Network</span>
      <h2 style={{fontSize: "clamp(28px,3.6vw,40px)", marginTop: "14px"}}>Creá. Compartí. Ganá.</h2>
      <p className="lede" style={{marginTop: "18px"}}>Convertite en afiliado y promocioná productos del marketplace.</p>
      <div style={{marginTop: "26px"}}>
        <div className="studio-prompt-label" style={{marginBottom: "8px"}}>Tu enlace de afiliado</div>
        <div className="link-box">
          <code>crow.market/ref/tu-usuario</code>
          <button className="btn btn-ghost btn-sm" id="copyLinkBtn">Copiar enlace</button>
        </div>
      </div>
      <Link href="/affiliate" className="btn btn-primary magnetic" style={{marginTop: "28px"}}>Quiero ser afiliado →</Link>
    </div>
    <div className="reveal" style={{transitionDelay: ".1s"}}>
      <div className="aff-panel">
        <div className="aff-panel-head"><b>Dashboard de afiliado</b><span className="studio-tag">Últimos 30 días</span></div>
        <div className="aff-metric-grid">
          <div className="aff-metric"><div className="num">$2,450</div><div className="lbl">Ingresos generados</div></div>
          <div className="aff-metric"><div className="num">124</div><div className="lbl">Ventas</div></div>
          <div className="aff-metric"><div className="num">8.4%</div><div className="lbl">Conversión</div><div className="aff-bar"><i style={{width: "64%"}}></i></div></div>
          <div className="aff-metric"><div className="num">6</div><div className="lbl">Equipo</div></div>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="engine">
  <div className="container engine-inner">
    <div className="section-head reveal">
      <span className="eyebrow">Estructura de comisiones</span>
      <h2>Una venta. Varias formas de crecer.</h2>
      <p>Cada venta del marketplace se reparte con reglas fijas y visibles. Así se distribuye el 100%.</p>
    </div>

    <div className="reveal" id="splitWrap">
      <div className="split-bar">
        <div className="split-seg s-creator" data-w="45">45% Creador</div>
        <div className="split-seg s-affiliate" data-w="30">30% Afiliado</div>
        <div className="split-seg s-levels" data-w="13">13%</div>
        <div className="split-seg s-crow" data-w="10">10%</div>
      </div>
      <div className="split-legend">
        <b><i style={{background: "linear-gradient(180deg,#8B5CF6,#5B18C4)"}}></i>Creador 45%</b>
        <b><i style={{background: "linear-gradient(180deg,#A855F7,#7B12FF)"}}></i>Afiliado directo 30%</b>
        <b><i style={{background: "rgba(168,85,247,0.35)"}}></i>Niveles residuales 13%</b>
        <b><i style={{background: "rgba(247,247,250,0.14)"}}></i>CROW 10%</b>
      </div>
    </div>

    <div className="engine-grid reveal-stagger">
      <div className="engine-card">
        <div className="pct">45%</div>
        <h3>El creador conserva la mayor parte</h3>
        <p>Quien construye el producto se queda con la porción más grande de cada venta.</p>
      </div>
      <div className="engine-card">
        <div className="pct">30%</div>
        <h3>Para el afiliado directo</h3>
        <p>Generá ventas compartiendo tus enlaces. Es la comisión de quien trae la venta.</p>
      </div>
      <div className="engine-card">
        <div className="pct">13%</div>
        <h3>Cinco niveles de ingresos residuales</h3>
        <p>Tu actividad puede generar comisiones adicionales dentro de tu estructura, repartidas entre los niveles 1 a 5.</p>
      </div>
      <div className="engine-card">
        <div className="pct">10%</div>
        <h3>Para CROW</h3>
        <p>Sostiene la infraestructura, el marketplace y el ecosistema.</p>
      </div>
    </div>

    <div className="levels-wrap reveal" id="levelsWrap">
      <div className="levels-head">
        <b>Niveles residuales</b>
        <span className="studio-tag">Sobre el total de la venta</span>
      </div>
      <div className="level-row"><span className="level-name">Nivel 1</span><span className="level-track"><i style={{"--w": "100%"} as React.CSSProperties}></i></span><span className="level-pct">5%</span><span className="level-amt" data-pct="5">30 USDT</span></div>
      <div className="level-row"><span className="level-name">Nivel 2</span><span className="level-track"><i style={{"--w": "60%"} as React.CSSProperties}></i></span><span className="level-pct">3%</span><span className="level-amt" data-pct="3">18 USDT</span></div>
      <div className="level-row"><span className="level-name">Nivel 3</span><span className="level-track"><i style={{"--w": "40%"} as React.CSSProperties}></i></span><span className="level-pct">2%</span><span className="level-amt" data-pct="2">12 USDT</span></div>
      <div className="level-row"><span className="level-name">Nivel 4</span><span className="level-track"><i style={{"--w": "40%"} as React.CSSProperties}></i></span><span className="level-pct">2%</span><span className="level-amt" data-pct="2">12 USDT</span></div>
      <div className="level-row"><span className="level-name">Nivel 5</span><span className="level-track"><i style={{"--w": "20%"} as React.CSSProperties}></i></span><span className="level-pct">1%</span><span className="level-amt" data-pct="1">6 USDT</span></div>
    </div>

    <div className="calc-box reveal">
      <div className="calc-head">
        <h3>Movelo y mirá cómo se reparte</h3>
        <div className="calc-value" id="calcTotal">600<small>USDT</small></div>
      </div>
      <input type="range" id="calcRange" min="20" max="2000" step="10" defaultValue="600" aria-label="Monto de la venta en USDT" />
      <div className="calc-grid">
        <div className="calc-cell"><div className="cl">Creador · 45%</div><div className="cv" data-pct="45">270</div></div>
        <div className="calc-cell hl"><div className="cl">Afiliado directo · 30%</div><div className="cv" data-pct="30">180</div></div>
        <div className="calc-cell"><div className="cl">Niveles 1–5 · 13%</div><div className="cv" data-pct="13">78</div></div>
        <div className="calc-cell"><div className="cl">CROW · 10%</div><div className="cv" data-pct="10">60</div></div>
      </div>
    </div>

    <div className="notes reveal">
      <div className="note">
        <b>Primer desbloqueo del Nivel 1</b>
        <p>En el primer desbloqueo, los 5 puntos del Nivel 1 se dividen temporalmente: 2,5% al afiliado y 2,5% a la Emergency Reserve, que no forma parte del reparto permanente.</p>
      </div>
      <div className="note">
        <b>Rewards Pool</b>
        <p>Recibe el 2% de las ventas de licencias. Es un circuito separado del reparto permanente de las ventas de productos.</p>
      </div>
      <div className="note">
        <b>Crow Points (CP)</b>
        <p>Son puntos de volumen y recompensa, 1:1 con los puntos de compra. No son dinero ni equivalen a un saldo retirable.</p>
      </div>
    </div>

    <p className="disclaimer" style={{maxWidth: "640px"}}>Los montos que ves son un ejemplo de cómo se aplica el reparto, no una proyección de ingresos. Las comisiones dependen de ventas reales confirmadas dentro del marketplace.</p>
  </div>
</section>


<section id="wallet">
  <div className="container wallet-layout">
    <div className="reveal">
      <div className="wallet-card">
        <div className="wallet-balance-lbl">Balance disponible</div>
        <div className="wallet-balance">1,280.50 <small>USDT</small></div>
        <div className="wallet-rows">
          <div className="wallet-row"><span>Comisiones</span><span>$640.00</span></div>
          <div className="wallet-row"><span>Ventas</span><span>$1,910.00</span></div>
          <div className="wallet-row"><span>Retiros</span><span>−$1,269.50</span></div>
        </div>
        <div className="wallet-actions">
          <button className="btn btn-primary btn-sm">Retirar</button>
          <button className="btn btn-ghost btn-sm">Ver historial</button>
        </div>
      </div>
    </div>
    <div className="reveal" style={{transitionDelay: ".1s"}}>
      <span className="eyebrow">Wallet</span>
      <h2 style={{fontSize: "clamp(28px,3.6vw,40px)", marginTop: "14px"}}>Todo tu dinero, en un solo lugar.</h2>
      <p className="lede" style={{marginTop: "18px"}}>Gestioná tu balance, tus comisiones y tus retiros en USDT desde un mismo panel, con historial claro de cada movimiento.</p>
      <p className="disclaimer" style={{border: "none", paddingTop: "0", marginTop: "20px"}}>Las ganancias dependen de tus ventas reales dentro del marketplace y del programa de afiliados. CROW no garantiza rentabilidad.</p>
    </div>
  </div>
</section>


<section id="founder">
  <div className="container">
    <div className="founder-card reveal">
      <span className="founder-badge">✦ Programa Founder</span>
      <h2 style={{fontSize: "clamp(28px,4vw,38px)"}}>Entrá temprano.<br />Construí con nosotros.</h2>
      <p className="lede" style={{marginTop: "18px"}}>El programa Founder está diseñado para quienes quieren formar parte de la primera etapa del ecosistema CROW.</p>
      <ul className="founder-list">
        <li>Acceso Founder</li>
        <li>Beneficios especiales</li>
        <li>Herramientas CROW</li>
        <li>Programa de afiliados</li>
        <li>Acceso prioritario a nuevas funciones</li>
      </ul>
      <a href="#founder" className="btn btn-primary magnetic">Conocer Founder →</a>
    </div>
  </div>
</section>


<section id="pricing">
  <div className="container">
    <div className="section-head reveal">
      <span className="eyebrow">Planes</span>
      <h2>Elegí cómo querés crecer.</h2>
    </div>
    <div className="price-grid reveal-stagger">
      <div className="price-card">
        <div className="price-tag">START</div>
        <div className="price-name">Para empezar</div>
        <div className="price-amt">20 <small>USDT</small></div>
        <ul className="price-feats">
          <li>Hasta 2 infoproductos</li>
          <li>1 publicado</li>
          <li>30 días de vigencia</li>
        </ul>
        <Link href="/creator/plans" className="btn btn-ghost btn-sm">Elegir Start</Link>
      </div>
      <div className="price-card">
        <div className="price-tag">BASIC</div>
        <div className="price-name">Para crecer</div>
        <div className="price-amt">50 <small>USDT</small></div>
        <ul className="price-feats">
          <li>Hasta 4 infoproductos</li>
          <li>3 publicados</li>
          <li>2 meses de vigencia</li>
        </ul>
        <Link href="/creator/plans" className="btn btn-ghost btn-sm">Elegir Basic</Link>
      </div>
      <div className="price-card featured">
        <div className="price-tag">PRO · RECOMENDADO</div>
        <div className="price-name">Para escalar</div>
        <div className="price-amt">100 <small>USDT</small></div>
        <ul className="price-feats">
          <li>Hasta 10 infoproductos</li>
          <li>5 publicados</li>
          <li>3 meses de vigencia</li>
        </ul>
        <Link href="/creator/plans" className="btn btn-primary btn-sm">Elegir Pro</Link>
      </div>
      <div className="price-card">
        <div className="price-tag">BUSINESS</div>
        <div className="price-name">Para equipos</div>
        <div className="price-amt">300 <small>USDT</small></div>
        <ul className="price-feats">
          <li>Hasta 20 infoproductos</li>
          <li>10 publicados</li>
          <li>5 meses de vigencia</li>
        </ul>
        <Link href="/creator/plans" className="btn btn-ghost btn-sm">Elegir Business</Link>
      </div>
      <div className="price-card">
        <div className="price-tag">ELITE</div>
        <div className="price-name">Sin límites</div>
        <div className="price-amt">500 <small>USDT</small></div>
        <ul className="price-feats">
          <li>Hasta 50 infoproductos</li>
          <li>30 publicados</li>
          <li>12 meses de vigencia</li>
        </ul>
        <Link href="/creator/plans" className="btn btn-ghost btn-sm">Elegir Elite</Link>
      </div>
    </div>
    <div style={{textAlign: "center", marginTop: "40px"}}>
      <Link href="/creator/plans" className="btn btn-ghost magnetic">Ver todos los planes →</Link>
    </div>
  </div>
</section>


<section id="ecosystem">
  <div className="container">
    <div className="section-head reveal" style={{marginLeft: "auto", marginRight: "auto", textAlign: "center"}}>
      <span className="eyebrow">Ecosistema</span>
      <h2>CROW no es solamente una herramienta. Es un ecosistema.</h2>
    </div>
    <div className="eco-flow reveal">
      <div className="eco-node">Creator</div>
      <div className="eco-link"></div>
      <div className="eco-node hl">AI</div>
      <div className="eco-link"></div>
      <div className="eco-node">Product</div>
      <div className="eco-link"></div>
      <div className="eco-node">Marketplace</div>
      <div className="eco-link"></div>
      <div className="eco-node">Affiliate</div>
      <div className="eco-link"></div>
      <div className="eco-node">Wallet</div>
      <div className="eco-link"></div>
      <div className="eco-node hl">Growth</div>
    </div>
  </div>
</section>


<section id="proof">
  <div className="container proof-row reveal">
    <p>Construyendo la próxima generación de productos digitales.</p>
    <div className="proof-tags">
      <span>AI-powered creation</span>
      <span>Global marketplace</span>
      <span>Affiliate ecosystem</span>
      <span>Digital products</span>
    </div>
  </div>
</section>


<section id="faq">
  <div className="container">
    <div className="section-head reveal" style={{marginLeft: "auto", marginRight: "auto", textAlign: "center"}}>
      <span className="eyebrow">Preguntas frecuentes</span>
      <h2>Todo lo que necesitás saber.</h2>
    </div>
    <div className="faq-list reveal" id="faqList">
      <div className="faq-item">
        <button className="faq-q">¿Qué es CROW?<span className="plus"></span></button>
        <div className="faq-a"><p>CROW es una plataforma que combina inteligencia artificial, un marketplace y un sistema de afiliados para que puedas crear, publicar y vender productos digitales.</p></div>
      </div>
      <div className="faq-item">
        <button className="faq-q">¿Qué puedo crear con CROW?<span className="plus"></span></button>
        <div className="faq-a"><p>Podés crear cursos, sitios interactivos, PDFs, ebooks y kits de recursos, usando Creator Studio para estructurar y generar el contenido.</p></div>
      </div>
      <div className="faq-item">
        <button className="faq-q">¿Necesito saber programación?<span className="plus"></span></button>
        <div className="faq-a"><p>No. Creator Studio está pensado para que definas tu idea en lenguaje simple y la IA se encargue de estructurar y construir el producto.</p></div>
      </div>
      <div className="faq-item">
        <button className="faq-q">¿Cómo funciona Creator Studio?<span className="plus"></span></button>
        <div className="faq-a"><p>Le contás a CROW qué querés crear, la IA arma el blueprint, genera módulos, lecciones, ejercicios y recursos, y te deja el producto listo para publicar.</p></div>
      </div>
      <div className="faq-item">
        <button className="faq-q">¿Puedo vender mis productos?<span className="plus"></span></button>
        <div className="faq-a"><p>Sí. Una vez publicado, tu producto queda disponible en el marketplace de CROW con su propia página comercial.</p></div>
      </div>
      <div className="faq-item">
        <button className="faq-q">¿Cómo funciona el marketplace?<span className="plus"></span></button>
        <div className="faq-a"><p>Es el espacio donde los productos creados por la comunidad de CROW se publican y se descubren, con categorías, precios y creadores visibles.</p></div>
      </div>
      <div className="faq-item">
        <button className="faq-q">¿Cómo puedo ser afiliado?<span className="plus"></span></button>
        <div className="faq-a"><p>Activás el programa de afiliados desde tu cuenta, obtenés tu enlace personal y empezás a promocionar productos del marketplace.</p></div>
      </div>
      <div className="faq-item">
        <button className="faq-q">¿Cómo recibo mis comisiones?<span className="plus"></span></button>
        <div className="faq-a"><p>Las comisiones se acreditan en tu Wallet de CROW a medida que se confirman las ventas generadas con tu enlace de afiliado.</p></div>
      </div>
      <div className="faq-item">
        <button className="faq-q">¿Qué métodos de pago utiliza CROW?<span className="plus"></span></button>
        <div className="faq-a"><p>CROW opera principalmente con USDT como moneda dentro de la plataforma, tanto para pagos como para el balance de tu Wallet.</p></div>
      </div>
    </div>
  </div>
</section>


<section id="final-cta">
  <div className="final-glow" aria-hidden="true"></div>
  <div className="container">
    <h2 className="reveal">Tu próxima idea puede convertirse en un producto.</h2>
    <p className="reveal" style={{transitionDelay: ".1s"}}>Construí, publicá y hacé crecer tu negocio digital con CROW.</p>
    <div className="hero-ctas reveal" style={{transitionDelay: ".2s"}}>
      <Link href="/register" className="btn btn-primary magnetic">Crear mi cuenta gratis →</Link>
      <Link href="/marketplace" className="btn btn-ghost">Explorar Marketplace</Link>
    </div>
  </div>
</section>


<footer>
  <div className="container">
    <div className="foot-top">
      <div className="foot-brand">
        <a href="#hero" className="brand"><img src="/crow-logo.png" alt="CROW" /> CROW</a>
        <p>AI-powered digital commerce.</p>
      </div>
      <div className="foot-col">
        <h5>Producto</h5>
        <Link href="/creator/studio">Creator Studio</Link>
        <Link href="/marketplace">Marketplace</Link>
        <Link href="/affiliate">Afiliados</Link>
        <Link href="/wallet">Wallet</Link>
      </div>
      <div className="foot-col">
        <h5>Empresa</h5>
        <a href="#ecosystem">Sobre CROW</a>
        <a href="#founder">Founder</a>
        <Link href="/creator/plans">Precios</Link>
      </div>
      <div className="foot-col">
        <h5>Legal</h5>
        <a href="#faq">Términos</a>
        <a href="#faq">Privacidad</a>
      </div>
    </div>
    <div className="foot-bottom">
      <span>© 2026 CROW Market. Todos los derechos reservados.</span>
      <div className="foot-langs">
        <span>🇪🇸</span><span>🇺🇸</span><span>🇧🇷</span><span>🇷🇺</span><span>🇮🇹</span><span>🇨🇳</span>
      </div>
    </div>
  </div>
</footer>


    </div>
  );
}
