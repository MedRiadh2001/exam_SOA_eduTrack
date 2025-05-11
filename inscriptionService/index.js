const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const db = require('./db');
const { produceEnrollmentEvent } = require('./kafka');

// Load proto
const def = protoLoader.loadSync('../proto/inscription.proto');
const proto = grpc.loadPackageDefinition(def).enrollment;

// gRPC service
const server = new grpc.Server();

server.addService(proto.EnrollmentService.service, {
    Enroll: async (call, callback) => {
        const { userId, courseId } = call.request;
        try {
          console.log("Inserting enrollment:", { userId, courseId });
          await db.query('INSERT INTO inscriptions (user_id, cours_id) VALUES ($1, $2)', [userId, courseId]);
      
          await produceEnrollmentEvent(userId, courseId);
          callback(null, { message: 'Enrollment successful' });
        } catch (err) {
          console.error("Error during enrollment:", err); // Ajouté
          callback({
            code: grpc.status.INTERNAL,
            message: 'Enrollment failed',
          });
        }
    },
      

  ListEnrollments: async (call, callback) => {
    const { userId } = call.request;
    try {
      const res = await db.query('SELECT * FROM inscriptions WHERE user_id = $1', [userId]);
      const enrollments = res.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        courseId: row.cours_id
      }));
      callback(null, { enrollments });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to fetch enrollments',
      });
    }
  }
});

server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), () => {
  console.log('EnrollmentService running on port 50053');
  server.start();
});
