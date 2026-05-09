"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import type { Screen } from "./types";

gsap.registerPlugin(ScrollTrigger);

const REVEAL_ELEMENTS = [
  ".home-title-group h1",
  ".care-team span",
  ".home-intro-card p",
  ".home-intro-card .primary-button",
  ".hero-caption-card",
  ".hero-proof div",
  ".home-section h2",
  ".home-section .section-heading p",
  ".narrative-text p",
  ".side-by-side-workflow .overline",
  ".workflow-subtitle",
  ".split-subtitle",
  ".ethics-banner h2",
  ".ethics-banner p",
  ".ethics-icon",
  ".home-final-cta h2",
  ".home-final-cta p",
  ".home-final-cta a",
  ".workspace-header h1",
  ".workspace-header p",
  ".workspace-header button",
  ".onboarding-heading h1",
  ".onboarding-heading p",
  ".onboarding-fields label",
  ".soft-info",
  ".onboarding-note",
  ".review-step label",
  ".review-card > div",
  ".consent-note",
].join(", ");

const REVEAL_GROUPS = [
  ".workflow-list",
  ".image-cards-grid",
  ".value-list",
  ".metric-grid",
  ".dashboard-grid",
  ".roadmap-layout",
  ".progress-layout",
  ".education-layout",
  ".consult-grid",
  ".handoff-grid",
  ".diagnosis-list",
  ".focus-option-grid",
].join(", ");

export function useLandingAnimations(
  rootRef: RefObject<HTMLElement | null>,
  screen: Screen,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const context = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          animate: "(prefers-reduced-motion: no-preference)",
        },
        (media) => {
          if (media.conditions?.reduceMotion) {
            gsap.set(`${REVEAL_ELEMENTS}, ${REVEAL_GROUPS} > *`, {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              clearProps: "all",
            });
            return;
          }

          gsap.utils.toArray<HTMLElement>(REVEAL_ELEMENTS).forEach((element) => {
            gsap.fromTo(
              element,
              { autoAlpha: 0, y: 20 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 84%",
                  once: true,
                },
              },
            );
          });

          gsap.utils.toArray<HTMLElement>(REVEAL_GROUPS).forEach((group) => {
            const children = Array.from(group.children);
            gsap.fromTo(
              children,
              { autoAlpha: 0, y: 22 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: "power2.out",
                stagger: 0.08,
                scrollTrigger: {
                  trigger: group,
                  start: "top 82%",
                  once: true,
                },
              },
            );
          });

          gsap.fromTo(
            ".home-hero-image",
            { scale: 1.04 },
            {
              scale: 1,
              duration: 1.4,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ".home-photo-wrap",
                start: "top 90%",
                once: true,
              },
            },
          );

          gsap.fromTo(
            ".collage-img-wrap.main-img",
            { autoAlpha: 0, x: 40, scale: 0.95 },
            {
              autoAlpha: 1,
              x: 0,
              scale: 1,
              duration: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ".workflow-image-collage",
                start: "top 80%",
                once: true,
              },
            },
          );

          gsap.fromTo(
            ".collage-img-wrap.secondary-img",
            { autoAlpha: 0, x: -30, y: 30, scale: 0.95 },
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: 1,
              ease: "power2.out",
              delay: 0.2,
              scrollTrigger: {
                trigger: ".workflow-image-collage",
                start: "top 80%",
                once: true,
              },
            },
          );

          gsap.fromTo(
            ".split-image-container img",
            { scale: 1.1 },
            {
              scale: 1,
              duration: 1.4,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ".split-image-container",
                start: "top 85%",
                once: true,
              },
            },
          );
        },
      );
    }, root);

    return () => context.revert();
  }, [rootRef, screen]);
}
