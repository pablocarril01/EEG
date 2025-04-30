import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // permite acceso desde el frontend
  },
})
export class DatosGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  // ✅ Este método se llama automáticamente cuando se inicializa el gateway
  afterInit(server: Server) {
    console.log('✅ WebSocket Gateway iniciado');
  }

  constructor() {
    console.log('🧪 Constructor del DatosGateway cargado');
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
    console.log(
      `📡 Datos enviados a ${usuarioId}:`,
      payload.datos?.length ?? 0,
    );
  }
}
