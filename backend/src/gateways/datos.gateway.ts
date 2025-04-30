import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DatosGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server; // '!' asegura a TypeScript que será inicializado por Nest

  afterInit() {
    console.log('✅ WebSocket Gateway iniciado');
  }

  // ✅ Firma válida sin decoradores de parámetros
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, usuarioId: string): void {
    client.join(usuarioId);
    console.log(`👤 Usuario ${usuarioId} se unió a la sala`);
  }

  enviarDatos(usuarioId: string, payload: any) {
    console.log(
      `📡 Enviando ${payload.datos?.length ?? 0} datos a ${usuarioId}`,
    );
    this.server.to(usuarioId).emit('nuevoDato', payload);
  }
}
