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

    function generarValorHexValido() {
      // Valores sin signo entre 30768 y 34768 para que, tras restar 32768, den -2000 a +2000
      const valor = Math.floor(Math.random() * 4000) + 30768;
      return valor.toString(16).toUpperCase().padStart(4, "0");
    }

    function generarPaquete() {
      let resultado = "i"; // Inicia con 'i'

      for (let grupo = 0; grupo < 500; grupo++) {
        let grupoHex = [];
        for (let i = 0; i < 8; i++) {
          grupoHex.push(generarValorHexValido());
        }

        resultado += grupoHex.join(",");

        if ((grupo + 1) % 50 === 0) {
          resultado += "fi";
        } else {
          resultado += ";";
        }
      }

      return resultado + "f"; // Termina con 'f'
    }

    async function enviarADispositivo() {
      const tiempoActual = Date.now();

      if (tiempoActual - tiempoInicio >= 61000) {
        console.log("⏳ Tiempo completado: Deteniendo envío de datos...");
        clearInterval(intervalo);
        await client.disconnect();
        process.exit(0);
      }

      for (let i = 0; i < 10; i++) {
        const paquete = generarPaquete();
        try {
          await client.rPush("proyecto:PEPI:Pablo:datos", paquete);
          console.log(
            `✅ Paquete agregado a la lista: ${paquete.substring(0, 50)}...`
          );
        } catch (err) {
          console.error("❌ Error al enviar a Redis:", err);
        }
      }
    }

    const intervalo = setInterval(enviarADispositivo, 1000);
  } catch (err) {
    console.error("❌ Error al conectar a Redis:", err);
  }
})();
