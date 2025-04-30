import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class DatosGateway implements OnGatewayInit {
  // 👇 Inyección automática del servidor WebSocket
  @WebSocketServer()
  server!: Server;

  // 👇 Se ejecuta una vez al arrancar el gateway
  afterInit(): void {
    console.log('✅ WebSocket Gateway iniciado');
  }

  // ✅ AQUÍ va el método handleJoinRoom
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: string): void {
    client.join(payload); // el payload es el usuarioId
    console.log(`👤 Usuario ${payload} se unió a la sala`);
  }

  // 👇 Método que tú llamas desde el servicio para emitir datos
  enviarDatos(usuarioId: string, payload: any): void {
    console.log(
      `📡 Enviando ${payload.datos?.length ?? 0} datos a ${usuarioId}`,
    );
    this.server.to(usuarioId).emit('nuevoDato', payload);
  }
}
