const axios = require("axios"); // Usar axios

const proyectoId = 33; // Reemplaza con tu proyecto_id real
const usuarioId = "prueba"; // Reemplaza con tu usuario_id real

// URL de la API que has creado en NestJS
const url = `http://localhost:3000/api/hexValues/${proyectoId}/${usuarioId}`;

async function fetchLastValues() {
  try {
    // Hacer la solicitud a la API usando axios
    const response = await axios.get(url);

    // Obtener los datos
    const rawData = response.data;
    console.log("Datos recibidos:", rawData);

    // Verificar que los datos son un array
    if (!Array.isArray(rawData)) {
      throw new Error("Los datos recibidos no son un array");
    }

    // Mostrar los tres últimos valores
    const lastThreeValues = rawData.slice(-3); // Obtiene los tres últimos elementos
    console.log("Últimos 3 valores:", lastThreeValues);
  } catch (error) {
    console.error("Error al obtener los datos:", error);
  }
}

fetchLastValues();
