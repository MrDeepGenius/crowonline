"use client";

import { useEffect } from "react";

/**
 * Comportamiento de la landing CROW original (nav, reveals, simulación del
 * Studio, FAQ, calculadora de comisiones). Portado del script inline original.
 */
export function CrowLandingClient() {
  useEffect(() => {
    const removers: Array<() => void> = [];
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const intervals: Array<ReturnType<typeof setInterval>> = [];
    const observers: Array<IntersectionObserver> = [];

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* navbar scroll state */
    const nav = document.getElementById("navbar");
    if (nav) {
      const onScroll = () => {
        if (window.scrollY > 30) nav.classList.add("scrolled");
        else nav.classList.remove("scrolled");
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      removers.push(() => window.removeEventListener("scroll", onScroll));
    }

    /* mobile menu */
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("mobileMenu");
    if (toggle && menu) {
      const onToggle = () => menu.classList.toggle("open");
      const links = Array.from(menu.querySelectorAll("a"));
      const close = () => menu.classList.remove("open");
      toggle.addEventListener("click", onToggle);
      links.forEach((a) => a.addEventListener("click", close));
      removers.push(() => {
        toggle.removeEventListener("click", onToggle);
        links.forEach((a) => a.removeEventListener("click", close));
      });
    }

    /* scroll reveal */
    const revealEls = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal, .reveal-stagger")
    );
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
      observers.push(io);
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }

    /* magnetic buttons */
    if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>(".magnetic").forEach((m) => {
        const onMove = (e: MouseEvent) => {
          const r = m.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.18;
          const y = (e.clientY - r.top - r.height / 2) * 0.3;
          m.style.transform = `translate(${x}px,${y}px)`;
        };
        const onLeave = () => {
          m.style.transform = "translate(0,0)";
        };
        m.addEventListener("mousemove", onMove);
        m.addEventListener("mouseleave", onLeave);
        removers.push(() => {
          m.removeEventListener("mousemove", onMove);
          m.removeEventListener("mouseleave", onLeave);
        });
      });
    }

    /* floating dots in hero */
    const heroBg = document.querySelector(".hero-bg");
    if (!reduceMotion && heroBg) {
      for (let i = 0; i < 14; i++) {
        const d = document.createElement("span");
        d.className = "dot";
        d.style.left = Math.random() * 100 + "%";
        d.style.top = 40 + Math.random() * 55 + "%";
        d.style.animationDuration = 10 + Math.random() * 10 + "s";
        d.style.animationDelay = Math.random() * 10 + "s";
        heroBg.appendChild(d);
      }
    }

    /* product surface simulation */
    const typeTarget = document.getElementById("typeTarget");
    const fullText =
      "Quiero crear un curso premium para ayudar a emprendedores a vender con inteligencia artificial.";
    const steps = Array.from(document.querySelectorAll<HTMLElement>(".studio-step"));
    const results = document.getElementById("studioResults");
    const studioFrame = document.getElementById("studioFrame");
    let played = false;

    const runSteps = () => {
      let idx = 0;
      const next = () => {
        if (idx > 0) {
          steps[idx - 1].classList.remove("active");
          steps[idx - 1].classList.add("done");
        }
        if (idx < steps.length) {
          steps[idx].classList.add("active");
          idx++;
          timers.push(setTimeout(next, 520));
        } else {
          timers.push(setTimeout(() => results?.classList.add("show"), 200));
        }
      };
      next();
    };

    const runStudioSequence = () => {
      if (played || !typeTarget) return;
      played = true;
      if (reduceMotion) {
        typeTarget.textContent = fullText;
        steps.forEach((s) => s.classList.add("active", "done"));
        results?.classList.add("show");
        return;
      }
      let i = 0;
      const typer = setInterval(() => {
        if (!typeTarget) return;
        typeTarget.textContent = fullText.slice(0, i);
        i++;
        if (i > fullText.length) {
          clearInterval(typer);
          timers.push(setTimeout(runSteps, 400));
        }
      }, 22);
      intervals.push(typer);
    };

    if ("IntersectionObserver" in window && studioFrame) {
      const studioIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              runStudioSequence();
              studioIo.unobserve(e.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      studioIo.observe(studioFrame);
      observers.push(studioIo);
    } else {
      runStudioSequence();
    }

    /* faq accordion */
    document.querySelectorAll<HTMLElement>(".faq-item").forEach((item) => {
      const q = item.querySelector<HTMLElement>(".faq-q");
      const a = item.querySelector<HTMLElement>(".faq-a");
      if (!q || !a) return;
      const onClick = () => {
        const isOpen = item.classList.contains("open");
        document.querySelectorAll<HTMLElement>(".faq-item.open").forEach((other) => {
          other.classList.remove("open");
          const otherA = other.querySelector<HTMLElement>(".faq-a");
          if (otherA) otherA.style.maxHeight = "";
        });
        if (!isOpen) {
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
        }
      };
      q.addEventListener("click", onClick);
      removers.push(() => q.removeEventListener("click", onClick));
    });

    /* split bar fill + levels reveal */
    const splitWrap = document.getElementById("splitWrap");
    const levelsWrap = document.getElementById("levelsWrap");
    const fillSplit = () => {
      splitWrap?.querySelectorAll<HTMLElement>(".split-seg").forEach((seg) => {
        seg.style.width = (seg.getAttribute("data-w") ?? "0") + "%";
      });
    };
    if ("IntersectionObserver" in window) {
      const engineIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            if (e.target === splitWrap) fillSplit();
            if (e.target === levelsWrap) levelsWrap.classList.add("lit");
            engineIo.unobserve(e.target);
          });
        },
        { threshold: 0.35 }
      );
      if (splitWrap) engineIo.observe(splitWrap);
      if (levelsWrap) engineIo.observe(levelsWrap);
      observers.push(engineIo);
    } else {
      fillSplit();
      levelsWrap?.classList.add("lit");
    }

    /* commission calculator */
    const range = document.getElementById("calcRange") as HTMLInputElement | null;
    const calcTotal = document.getElementById("calcTotal");
    const fmt = (n: number) =>
      (Math.round(n * 100) / 100).toLocaleString("es-AR", {
        maximumFractionDigits: 2,
      });
    const updateCalc = () => {
      if (!range || !calcTotal) return;
      const total = parseFloat(range.value);
      calcTotal.innerHTML = fmt(total) + "<small>USDT</small>";
      document.querySelectorAll<HTMLElement>(".calc-cell .cv").forEach((cv) => {
        cv.textContent = fmt((total * parseFloat(cv.getAttribute("data-pct") ?? "0")) / 100);
      });
      document.querySelectorAll<HTMLElement>(".level-amt").forEach((la) => {
        la.textContent =
          fmt((total * parseFloat(la.getAttribute("data-pct") ?? "0")) / 100) + " USDT";
      });
    };
    if (range) {
      range.addEventListener("input", updateCalc);
      updateCalc();
      removers.push(() => range.removeEventListener("input", updateCalc));
    }

    /* copy affiliate link */
    const copyBtn = document.getElementById("copyLinkBtn");
    if (copyBtn) {
      const onClick = () => {
        const text = "crow.market/ref/tu-usuario";
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        const original = copyBtn.textContent;
        copyBtn.textContent = "Copiado ✓";
        timers.push(
          setTimeout(() => {
            copyBtn.textContent = original ?? "";
          }, 1800)
        );
      };
      copyBtn.addEventListener("click", onClick);
      removers.push(() => copyBtn.removeEventListener("click", onClick));
    }

    return () => {
      removers.forEach((fn) => fn());
      observers.forEach((io) => io.disconnect());
      timers.forEach((t) => clearTimeout(t));
      intervals.forEach((t) => clearInterval(t));
    };
  }, []);

  return null;
}
