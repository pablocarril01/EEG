import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppService } from '../app.service';

@WebSocketGateway({
  path: '/socket.io',
  cors: {
    origin: ['http://localhost:3001', 'https://193.146.34.10'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EegGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EegGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly appService: AppService) {
    this.logger.log('▶️ EegGateway instanciado y listo');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🔗 Cliente conectado [${client.id}]`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Cliente desconectado [${client.id}]`);
  }

  @SubscribeMessage('solicitarDatos')
  async solicitarDatos(
    client: Socket,
    payload: { proyectoId: string; usuarioId: string },
  ) {
    this.logger.log(
      `📨 Solicitud de datos recibida: proyecto=${payload.proyectoId}, usuario=${payload.usuarioId}`,
    );
    try {
      const response = await this.appService.getProyectoInfo(
        payload.proyectoId,
        payload.usuarioId,
      );
      client.emit('datosRecibidos', response);
      this.logger.log(`✅ Datos enviados al cliente [${client.id}]`);
    } catch (error) {
      this.logger.error('❌ Error al obtener datos:', error);
      client.emit('datosRecibidos', null);
    }
  }
}
