const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { authMiddleware } = require('./auth');
const resolvers = require('./resolvers');
const typeDefs = fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8');

async function start() {
  const app = express();

  // REST for auth and profile
  app.use(express.json());
  app.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    const { message } = await new Promise((r,j) =>
      require('./grpc_client').userClient.Register({ email, password }, (e, resp) => e ? j(e) : r(resp))
    );
    res.json({ message });
  });

  app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const token = await new Promise((r,j) =>
      require('./grpc_client').userClient.Login({ email, password }, (e, resp) => e ? j(e) : r(resp.token))
    );
    res.json({ token });
  });

  const getUserFromToken = (token) => {
    if (!token) return null;
  
    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
      return decoded;
    } catch (err) {
      console.error("Token verification failed:", err);
      return null;
    }
  };

  // GraphQL
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        
        const user = getUserFromToken(req.headers.authorization);
        return { user };
      },
  });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`API Gateway running at http://localhost:${port}`);
    console.log(`GraphQL endpoint at http://localhost:${port}/graphql`);
  });
}

start();
