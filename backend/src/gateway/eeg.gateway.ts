import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppService } from '../app.service';

@WebSocketGateway({
  cors: { origin: 'http://123.146.34.10' },
})
export class EegGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly appService: AppService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('solicitarDatos')
  async handleDataRequest(
    client: Socket,
    payload: { proyectoId: string; usuarioId: string },
  ) {
    try {
      const response = await this.appService.getProyectoInfo(
        payload.proyectoId,
        payload.usuarioId,
      );
      client.emit('datosRecibidos', response);
    } catch (error) {
      console.error('❌ Error al obtener datos:', error);
      client.emit('datosRecibidos', null);
    }
  }
}
