import { createClient } from "redis";
import dotenv from "dotenv";

// Cargar variables de entorno desde .env
dotenv.config();

// Crear y conectar el cliente Redis
const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  password: process.env.REDIS_PASSWORD,
  database: process.env.REDIS_DB,
});

client.on("error", (err) => {
  console.error("❌ Error en Redis:", err);
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Conectado a Redis");

    let tiempoInicio = Date.now(); // Guarda el tiempo de inicio
    let contadorRampa = 0; // Controla el ciclo de la rampa
    let cicloRampa = 200; // Número de pasos en el ciclo
    let pendiente = 1; // Factor de pendiente

    function actualizarPendiente() {
      pendiente = Math.random() * (1.2 - 0.15) + 0.15; // Generar un valor entre 15% y 120%
      cicloRampa = Math.round(200 / pendiente); // Ajustar la duración del ciclo con la nueva pendiente
      console.log(`🔄 Nueva pendiente: ${Math.round(pendiente * 100)}%`);
    }

    function generarPaquete() {
      let resultado = "i"; // Inicia con 'i'
      let contadorGrupos = 0;

      for (let i = 0; i < 500; i++) {
        // 500 grupos de 8 valores
        let grupo = [];

        for (let j = 0; j < 8; j++) {
          // Generar rampa periódica con pendiente variable
          let valorBase =
            10000 + ((contadorRampa % cicloRampa) / cicloRampa) * 10000;

          // Agregar ruido del 2%
          let ruido = (Math.random() * 0.04 - 0.02) * valorBase;
          let valorFinal = Math.round(valorBase + ruido);

          // Convertir a hexadecimal de 16 bits
          let valorHex = valorFinal.toString(16).toUpperCase().padStart(4, "0");

          grupo.push(valorHex);
        }

        resultado += grupo.join(",");

        contadorGrupos++;
        contadorRampa++; // La rampa avanza

        if (contadorGrupos % 50 === 0) {
          resultado += "fi"; // Cada 50 grupos agregar "fi"
        } else {
          resultado += ";"; // Separador entre grupos de 8
        }

        // Si la rampa llega al máximo, actualizar la pendiente
        if (contadorRampa % cicloRampa === 0) {
          actualizarPendiente();
        }
      }

      return resultado + "f"; // Termina con 'f'
    }

    async function enviarADispositivo() {
      const tiempoActual = Date.now();

      if (tiempoActual - tiempoInicio >= 61000) {
        // 1 minuto + 1 segundo
        console.log("⏳ Tiempo completado: Deteniendo envío de datos...");
        clearInterval(intervalo);
        await client.disconnect(); // Cierra la conexión a Redis
        process.exit(0);
      }

      for (let i = 0; i < 10; i++) {
        // Enviar 10 paquetes por segundo
        const paquete = generarPaquete();
        try {
          await client.rPush("proyecto:PEPI:Pablo:datos", paquete); // Agregar a la lista en Redis
          console.log(
            `✅ Paquete agregado a la lista: ${paquete.substring(0, 50)}...`
          );
        } catch (err) {
          console.error("❌ Error al enviar a Redis:", err);
        }
      }
    }

    const intervalo = setInterval(enviarADispositivo, 1000); // Enviar cada segundo
  } catch (err) {
    console.error("❌ Error al conectar a Redis:", err);
  }
})();
