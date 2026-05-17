const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:5173'],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('joinTicket', (ticketId) => {
      if (!ticketId) return;
      socket.join(ticketId);
    });

    socket.on('leaveTicket', (ticketId) => {
      if (!ticketId) return;
      socket.leave(ticketId);
    });

    socket.on('disconnect', () => {
      // Connection closed gracefully or by client
    });
  });

  return io;
};

const getIo = () => io;

module.exports = { initSocket, getIo };
