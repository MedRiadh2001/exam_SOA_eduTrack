const { userClient, courseClient, enrollClient } = require('./grpc_client');

module.exports = {
  Query: {
    getCourses: () => new Promise((res, rej) => {
      courseClient.ListCourses({}, (err, resp) => err ? rej(err) : res(resp.courses));
    }),
    getCourse: (_, { id }) => new Promise((res, rej) => {
      courseClient.GetCourse({ id }, (err, resp) => err ? rej(err) : res(resp));
    }),
    getMyEnrollments: (_, __, { user }) => new Promise((res, rej) => {
      enrollClient.ListEnrollments({ userId: user.id }, (err, resp) => err ? rej(err) : res(resp.enrollments));
    }),
  },

  Mutation: {
    register: (_, { email, password }) => new Promise((res, rej) => {
      userClient.Register({ email, password }, (err, resp) => err ? rej(err) : res(resp.message));
    }),
    login: (_, { email, password }) => new Promise((res, rej) => {
      userClient.Login({ email, password }, (err, resp) => err ? rej(err) : res(resp.token));
    }),
    enrollInCourse: (_, { courseId }, { user }) => new Promise((res, rej) => {
        if (!user || !user.id) {
          return rej(new Error('User is not authenticated'));
        }
        
        enrollClient.Enroll({ userId: user.id, courseId }, (err, resp) => {
            console.log('Calling Enroll with:', { courseId, userId:user.id });
          if (err) {
            console.error('gRPC call failed:', err);
            return rej(new Error('Enrollment failed'));
          }
          res(resp.message);
        });
      }),
    addCourse: (_, { title, description }) => new Promise((res, rej) => {
        courseClient.AddCourse({ title, description }, (err, resp) =>
          err ? rej(err) : res(resp)
        );
    }),
  }
};
