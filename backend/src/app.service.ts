import { Injectable } from '@nestjs/common';
import { RedisProvider } from './redis/redis.provider';

@Injectable()
export class AppService {
  constructor(private readonly redisProvider: RedisProvider) {}

  async getProyectoInfo(proyectoId: string, usuarioId: string): Promise<{ datos: number[][]; comentarios: string[] }> {
    try {
      const rawData = await this.redisProvider.getData(proyectoId, usuarioId);
      let comentarios = await this.redisProvider.getComentarios(proyectoId, usuarioId);

      // Procesar cada elemento de la variable "comentarios"
      comentarios = comentarios.map(item => {
        const itemSinAmpersand = item.replace(/&/g, "");
        const partes = itemSinAmpersand.split("$");
    
        if (partes.length === 2) {
            const fechaUnix = parseInt(partes[0], 10);
            const mensaje = partes[1];
    
            if (!isNaN(fechaUnix)) {
                // Convertir a fecha local en España
                const fecha = new Date(fechaUnix * 1000);
                const fechaLegible = fecha.toLocaleString("es-ES", {
                    timeZone: "Europe/Madrid", // Ajuste a la zona horaria de España
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                }).replace(",", "");
    
                return `${fechaLegible}: ${mensaje}`;
            } else {
                return `Error con la fecha en: ${item}`;
            }
        } else {
            return `Formato incorrecto en: ${item}`;
        }
    });
    



      if (!rawData || rawData.length === 0) return { datos: [], comentarios };

      console.log('📌 Datos crudos de Redis:', rawData);
      console.log('📌 Comentarios crudos de Redis:', comentarios);

      let processedData: number[][] = [];

      rawData.forEach((entry) => {
        entry = entry.replace(/\s/g, '').replace(/^i|f$/g, '');
        const sequences = entry.split(/fi|if/);

        sequences.forEach((seq) => {
          const groups = seq.split(';');
          groups.forEach((group) => {
            const hexValues = group.split(',').filter(v => v.length > 0);
            if (hexValues.length === 8) {
              const decimalValues = hexValues.map(val => parseInt(val, 16));
              processedData.push(decimalValues);
            }
          });
        });
      });
      
      //Filtrado

      function calcularMedias(listaDeListas: number[][]): number[] {
        const numElementos = listaDeListas.length;
        if (numElementos === 0) return Array(8).fill(0); // Si la lista está vacía, devuelve un vector de ceros.
      
        const sumas = Array(8).fill(0); // Inicializa un array de sumas con 8 valores en 0.
      
        listaDeListas.forEach(lista => {
          lista.forEach((valor, indice) => {
            sumas[indice] += valor; // Suma los valores en sus respectivas posiciones.
          });
        });
      
        return sumas.map(suma => suma / numElementos); // Calcula las medias dividiendo entre la cantidad de listas.
      }

      function restarMedias(listaDeListas: number[][], medias: number[]): number[][] {
        return listaDeListas.map(lista => 
          lista.map((valor, indice) => valor - medias[indice])
        );
      }

      function calcularMedianas(listaDeListas: number[][]): number[] {
        const numElementos = listaDeListas.length;
        if (numElementos === 0) return Array(8).fill(0); // Si está vacío, devuelve un vector de ceros.
      
        const columnas = Array.from({ length: 8 }, (_, i) => 
          listaDeListas.map(lista => lista[i]).sort((a, b) => a - b)
        );
      
        return columnas.map(columna => {
          const mitad = Math.floor(columna.length / 2);
          return columna.length % 2 === 0
            ? (columna[mitad - 1] + columna[mitad]) / 2 // Promedio de los dos valores centrales
            : columna[mitad]; // Valor central si la longitud es impar
        });
      }
      
      function restarMedianas(listaDeListas: number[][], medianas: number[]): number[][] {
        return listaDeListas.map(lista => 
          lista.map((valor, indice) => valor - medianas[indice])
        );
      }

      const medias = calcularMedias(processedData);
      console.log(medias);
      
      const medianas = calcularMedianas(processedData);
      console.log(medianas);

      //Reducción de valores
      processedData = processedData.filter((_, index) => index % 5 === 0);

      //processedData = restarMedianas(processedData, medianas);
      processedData = restarMedias(processedData, medias);

      return { datos: processedData, comentarios };
    } catch (error) {
      console.error('❌ Error procesando los datos:', error);
      return { datos: [], comentarios: [] };
    }
  }
}
