// contains all knowledge required to tell graphQL what your application's data looks like //
// all properties each object has and relations //
const graphql = require('graphql');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull
} = graphql;
const axios = require('axios');

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  // resolve circular references by converting to arrow function //
  // example of JS closures - file is defined but not executed until after definition //
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then(res => res.data);
      }
    }
  })
});

// this type shows the properties a User will have //
const UserType = new GraphQLObjectType({
  name: 'User',
  // outlines properties //
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      // resolve differences between data type and json api call //
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(res => res.data);
      }
    }
  })
});

// GraphQL requires a root query to determine where to start query eg. 'find me a user with id 23' //
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      // resolve function - actually go into database and find actual data we are looking for //
      // args argument is the arg that is passed in to the initial query //
      resolve(parentValue, args) {
        return (
          axios
            .get(`http://localhost:3000/users/${args.id}`)
            // axios bug otherwise would be .data.data //
            .then(res => res.data)
        );
      }
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${args.id}`)
          .then(res => res.data);
      }
    }
  }
});

// for manipulating data //
const RootMutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    // different field properties - describe the operation each mutation will undertake //
    addUser: {
      // type is the type of data that will be resolved //
      type: UserType,
      args: {
        // make field required - non null //
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age }) {
        return axios
          .post(`http://localhost:3000/users`, { firstName, age })
          .then(res => res.data);
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parentValue, args) {
        return axios
          .delete(`http://localhost:3000/users/${args.id}`)
          .then(res => res.data);
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, args) {
        // use patch instead of put request because put is an overwriting step - eg. if age was not included, then age would be set to null //
        return axios
          .patch(`http://localhost:3000/users/${args.id}`, args)
          .then(res => res.data);
      }
    }
  }
});

// GraphQL Schema //
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation
});
