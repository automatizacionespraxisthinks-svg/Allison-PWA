import dns from "node:dns";

/**
 * Las conexiones salen primero por IPv4. Donde IPv6 está configurado pero
 * no tiene salida, Node intentaba por ahí la conexión con Gemini y se
 * quedaba esperando: turnos de 10 a 30 segundos, o "Allison no pudo
 * responder", con la intervención devuelta. Se vio en las pruebas del 2 de
 * noviembre de 2026 (con IPv4 primero: mediana 2,1 s, máximo 3,8 s en 30
 * turnos). Si IPv4 funciona, no cambia nada; si no, Node igual prueba IPv6.
 */
dns.setDefaultResultOrder("ipv4first");
