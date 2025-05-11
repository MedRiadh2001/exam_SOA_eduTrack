const grpc = require('@grpc/grpc-js');
const loader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

function loadProto(filename) {
    const def = loader.loadSync(path.join(__dirname, '..', 'proto', filename));
    return grpc.loadPackageDefinition(def);
}

const userProto = loadProto('user.proto').user;
const courseProto = loadProto('cours.proto').course;
const enrollProto = loadProto('inscription.proto').enrollment;

function makeClient(proto, host, port) {
  return new proto[Object.keys(proto)[0]](
    `${host}:${port}`,
    grpc.credentials.createInsecure()
  );
}

module.exports = {
  userClient: makeClient(userProto, process.env.USER_HOST, process.env.USER_PORT),
  courseClient: makeClient(courseProto, process.env.COURSE_HOST, process.env.COURSE_PORT),
  enrollClient: makeClient(enrollProto, process.env.ENROLL_HOST, process.env.ENROLL_PORT),
};
