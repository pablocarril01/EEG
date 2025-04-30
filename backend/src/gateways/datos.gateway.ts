import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DatosGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server; // ✅ el "!" dice que lo inyectará NestJS después

  afterInit() {
    console.log('✅ WebSocket Gateway iniciado');
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() usuarioId: string,
    @ConnectedSocket() client: Socket,
  ) {
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
