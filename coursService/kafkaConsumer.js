const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'cours-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'course-group' });

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-enrolled', fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`👂 Event received: User ${data.userId} enrolled in Course ${data.courseId}`);
    }
  });
};

module.exports = { startConsumer };
