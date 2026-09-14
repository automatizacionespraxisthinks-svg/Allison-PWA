"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

/**
 * Un campo de contraseña con el ojo para verla.
 *
 * En el celular se escribe a ciegas con el pulgar: una letra de más y
 * sale "contraseña incorrecta", o peor, una cuenta creada con una clave
 * que nadie sabe cuál es. El ojo deja comprobar lo escrito antes de
 * enviarlo.
 *
 * Arma su propia etiqueta en vez de ir dentro de un <label>: una
 * etiqueta solo puede envolver UN control, y el botón del ojo es otro.
 */
export function CampoContrasena({
  etiqueta,
  ayuda,
  className,
  ...campo
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
  etiqueta: string;
  /** Texto de ayuda debajo del campo. */
  ayuda?: ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);

  // Al enviar, la clave vuelve a ocultarse ANTES de que el navegador
  // procese el formulario: los administradores de contraseñas solo
  // ofrecen guardar un campo de tipo password, y una clave que sigue a
  // la vista en la pantalla siguiente queda expuesta a quien esté al lado.
  useEffect(() => {
    const formulario = ref.current?.form;
    if (!formulario) return;
    const ocultar = () => {
      if (ref.current) ref.current.type = "password";
      setVisible(false);
    };
    formulario.addEventListener("submit", ocultar, true);
    return () => formulario.removeEventListener("submit", ocultar, true);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          {...campo}
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          // A la vista es un campo de texto: sin esto, el teclado del
          // celular le pondría mayúscula a la primera letra o "corregiría"
          // la clave, y lo que se ve dejaría de ser lo que se envía.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${className ?? ""} w-full pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // Sin robarle el foco al campo: en el celular cerraría el teclado.
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Mostrar contraseña"
          aria-pressed={visible}
          aria-controls={id}
          title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-texto-suave transition hover:text-texto"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {visible ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="M2 2l20 20" />
              </>
            ) : (
              <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {ayuda && <span className="text-xs text-texto-suave">{ayuda}</span>}
    </div>
  );
}
