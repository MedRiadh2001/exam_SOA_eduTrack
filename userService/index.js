const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');

// Load proto
const packageDef = protoLoader.loadSync('../proto/user.proto');
const proto = grpc.loadPackageDefinition(packageDef).user;

// gRPC server setup
const server = new grpc.Server();

server.addService(proto.UserService.service, {
  Register: async (call, callback) => {
    const { email, password } = call.request;
    try {
      const hash = await bcrypt.hash(password, 10);
      await db.execute('INSERT INTO users (email, password) VALUES (?, ?)', [email, hash]);
      callback(null, { message: 'User registered successfully' });
    } catch (err) {
      callback({
        code: grpc.status.ALREADY_EXISTS,
        message: 'User already exists',
      });
    }
  },

  Login: async (call, callback) => {
    const { email, password } = call.request;
    try {
      const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      const user = rows[0];
      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found',
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: 'Incorrect password',
        });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
      callback(null, { token });

    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Server error',
      });
    }
  }
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('UserService running on port 50051');
  server.start();
});
