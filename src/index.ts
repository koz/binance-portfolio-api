import 'reflect-metadata';
import express from 'express';
import session from 'express-session';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { AuthResolver } from './resolvers/AuthResolver';
import { TokensResolver } from './resolvers/TokensResolver';

import MongoStore from 'connect-mongo';
import mongo from 'mongoose';
import { ExchangeResolver } from './resolvers/ExchangeResolver';
import { updateExchangeInfo } from './middleware/updateExchangeInfo';

const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.op1pd.mongodb.net/test?retryWrites=true&w=majority`;

(async () => {
  const app = express();

  app.use(
    session({
      store: MongoStore.create({ mongoUrl: mongoUri }),
      name: 'qid',
      secret: process.env.SESSION_SECRET || 'aslkdfjoiq12312',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7 * 365, // 7 years
      },
    })
  );

  mongo.connect(mongoUri);
  mongo.connection.on('open', function () {
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`server started at http://localhost:${port}/graphql`);
    });
  });

  let schema;
  try {
    schema = await buildSchema({
      resolvers: [AuthResolver, TokensResolver, ExchangeResolver],
      validate: false,
    });
  } catch (e) {
    console.error(e);
    throw e;
  }

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  if (process.env.NODE_ENV === 'production') {
    app.use(updateExchangeInfo);
  }
})();
