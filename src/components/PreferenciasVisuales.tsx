"use client";

import { useEffect } from "react";
import { aplicarAnimaciones } from "@/lib/sonidos";

/** Aplica al cargar si el alumno apagó las animaciones en este aparato. */
export function PreferenciasVisuales() {
  useEffect(() => aplicarAnimaciones(), []);
  return null;
}
