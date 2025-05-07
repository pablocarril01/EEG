import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EmisionAutomaticaService } from '../servicios/emision-automatica.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DatosGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly emisionService: EmisionAutomaticaService) {}

  afterInit() {
    this.emisionService.setServer(this.server);
    console.log('✅ Gateway inicializado');
  }

  handleConnection(client: Socket) {
    console.log(`📡 Cliente conectado: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() usuarioId: string, client: Socket) {
    client.join(usuarioId);
    console.log(`👤 Cliente ${client.id} se unió a la sala: ${usuarioId}`);
  }

  /**
   * Método para que AppService o cualquier otro servicio pueda emitir datos a un usuario específico
   */
  enviarDatos(
    usuarioId: string,
    payload: { datos: number[][]; comentarios: string[] },
  ) {
    this.server.to(usuarioId).emit('nuevoDato', payload);
    console.log(`📤 Datos enviados manualmente a ${usuarioId}:`, payload);
  }
}
