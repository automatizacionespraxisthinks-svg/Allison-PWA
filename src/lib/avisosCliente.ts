"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Los avisos en el celular, del lado del navegador: pedir permiso,
 * suscribir este aparato y avisarle al servidor (/api/avisos).
 *
 * Dónde funcionan: Android con Chrome (instalada o desde el navegador) y
 * el computador. En iPhone, solo con la app agregada a la pantalla de
 * inicio (iOS 16.4 o posterior): desde Safari no se puede.
 */
export type EstadoAvisos =
  | "cargando"
  /** El navegador no tiene avisos. */
  | "no-compatible"
  /** iPhone desde Safari: hay que agregar la app a la pantalla de inicio. */
  | "ios-instalar"
  /** El alumno bloqueó los avisos para esta página: se cambia en el navegador. */
  | "bloqueado"
  /** El servidor no tiene las llaves (VAPID). */
  | "sin-configurar"
  | "activo"
  | "inactivo";

function esIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function instalada(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

function compatible(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** La llave pública llega en base64 para URL; el navegador la quiere en bytes. */
function aBytes(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

async function pedir(cuerpo: unknown): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch("/api/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/**
 * Algunos navegadores sin servicio de avisos (Chromium sin los servicios
 * de Google, ventanas incrustadas) nunca responden a pushManager: sin
 * este límite el ajuste se quedaría cargando para siempre.
 */
function conLimite<T>(promesa: Promise<T>, ms = 4000): Promise<T> {
  return Promise.race([promesa, new Promise<never>((_, no) => setTimeout(() => no(new Error("sin respuesta")), ms))]);
}

async function suscripcionActual(): Promise<PushSubscription | null> {
  const reg = await conLimite(navigator.serviceWorker.getRegistration());
  return (await conLimite(reg?.pushManager.getSubscription() ?? Promise.resolve(null))) ?? null;
}

/** El estado de los avisos en este aparato, y cómo cambiarlo. */
export function useAvisos() {
  const [estado, setEstado] = useState<EstadoAvisos>("cargando");
  const [hora, setHora] = useState<string | null>(null);
  const [llave, setLlave] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const revisar = useCallback(async () => {
    if (!compatible()) return setEstado(esIOS() && !instalada() ? "ios-instalar" : "no-compatible");
    if (esIOS() && !instalada()) return setEstado("ios-instalar");
    const sub = await suscripcionActual().catch(() => null);
    const r = await pedir({ accion: "estado", endpoint: sub?.endpoint ?? null });
    setLlave((r?.llave as string | null) ?? null);
    setHora((r?.hora as string | null) ?? null);
    if (!r?.llave) return setEstado("sin-configurar");
    if (Notification.permission === "denied") return setEstado("bloqueado");
    setEstado(r.activo ? "activo" : "inactivo");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void revisar(), 0);
    return () => clearTimeout(t);
  }, [revisar]);

  /** Pide permiso y suscribe este aparato. Devuelve si quedó activo. */
  const activar = useCallback(async (): Promise<boolean> => {
    if (!llave) return false;
    setOcupado(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(llave) }));
      const r = await pedir({ accion: "activar", suscripcion: sub.toJSON() });
      if (!r) return false;
      setHora((r.hora as string | null) ?? hora);
      setEstado("activo");
      return true;
    } catch {
      return false;
    } finally {
      setOcupado(false);
    }
  }, [hora, llave]);

  const desactivar = useCallback(async () => {
    setOcupado(true);
    try {
      const sub = await suscripcionActual();
      if (sub) {
        await pedir({ accion: "desactivar", endpoint: sub.endpoint });
        await sub.unsubscribe().catch(() => false);
      }
      setEstado("inactivo");
    } finally {
      setOcupado(false);
    }
  }, []);

  return { estado, hora, ocupado, activar, desactivar };
}
