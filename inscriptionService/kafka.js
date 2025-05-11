const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'inscription-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const produceEnrollmentEvent = async (userId, courseId) => {
  await producer.connect();
  await producer.send({
    topic: 'user-enrolled',
    messages: [
      {
        key: 'enrollment',
        value: JSON.stringify({ userId, courseId, timestamp: Date.now() })
      }
    ]
  });
  await producer.disconnect();
};

module.exports = { produceEnrollmentEvent };
