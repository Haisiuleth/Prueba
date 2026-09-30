import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers, Context } from './graphql/schema';
import { getUserId } from './auth';
import productsRouter from './routes/products';

async function main() {
  await mongoose.connect(process.env.MONGO_URI as string);

  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/products', productsRouter);

  const apollo = new ApolloServer<Context>({ typeDefs, resolvers });
  await apollo.start();
  app.use(
    '/graphql',
    expressMiddleware(apollo, {
     context: async ({ req }) => {
  const userId = getUserId(req.headers.authorization);
  return { userId };
},
    })
  );

  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`API en http://localhost:${port}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
