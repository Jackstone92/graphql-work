const express = require('express');
const expressGraphQL = require('express-graphql');

// import GraphQL Schema //
const schema = require('./schema/schema');

const app = express();

// GraphQL middleware //
app.use(
  '/graphql',
  expressGraphQL({
    // must contain a schema //
    schema,
    graphiql: true
  })
);

app.listen(4000, () => {
  console.log('listening...');
});
