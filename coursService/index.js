const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
require('./db');
const Course = require('./models/cours');
const { startConsumer } = require('./kafkaConsumer');

const def = protoLoader.loadSync('../proto/cours.proto');
const courseProto = grpc.loadPackageDefinition(def).course;

const server = new grpc.Server();

server.addService(courseProto.CourseService.service, {
    AddCourse: async (call, callback) => {
        try {
          const { title, description } = call.request;
          const course = new Course({ title, description });
          await course.save();
          callback(null, {
            id: course._id.toString(),
            title: course.title,
            description: course.description
          });
        } catch (err) {
          callback({
            code: grpc.status.INTERNAL,
            message: 'Failed to add course',
          });
        }
      },

  ListCourses: async (_, callback) => {
    try {
      const courses = await Course.find();
      const courseList = courses.map(c => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description
      }));
      callback(null, { courses: courseList });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to fetch courses',
      });
    }
  },
  GetCourse: async (call, callback) => {
    try {
      const { id } = call.request;
      const course = await Course.findById(id);
      if (!course) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Course not found',
        });
      }
      callback(null, {
        id: course._id.toString(),
        title: course.title,
        description: course.description
      });
    } catch (err) {
      callback({
        code: grpc.status.INTERNAL,
        message: 'Failed to fetch course',
      });
    }
  }
});

server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(),async () => {
  console.log('CourseService running on port 50052');
  server.start();
  await startConsumer();
});
