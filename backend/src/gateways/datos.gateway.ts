import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DatosGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor() {
    console.log('🧪 Constructor del DatosGateway cargado');
  }

  afterInit(): void {
    console.log('✅ WebSocket Gateway iniciado');
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: any, payload: string): void {
    client.join(payload);
    console.log(`👤 Usuario ${payload} se unió a la sala`);
  }

  enviarDatos(usuarioId: string, payload: any) {
    console.log(
      `📡 Enviando ${payload.datos?.length ?? 0} datos a ${usuarioId}`,
    );
    this.server.to(usuarioId).emit('nuevoDato', payload);
  }
}
