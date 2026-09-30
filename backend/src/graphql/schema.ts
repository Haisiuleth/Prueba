import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { User } from '../models/User';
import { signToken } from '../auth';

export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    name: String!
    lastName: String!
    email: String!
    userType: String!
    createdAt: String!
  }
  type AuthPayload { token: String!, user: User! }
  input UpdateUserInput { name: String, lastName: String, email: String }

  type Query { me: User }
  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    updateUser(input: UpdateUserInput!): User!
  }
`;

export interface Context { userId: string | null }

const toGql = (u: any) => ({
  id: u._id.toString(),
  username: u.username,
  name: u.name,
  lastName: u.lastName,
  email: u.email,
  userType: u.userType,
  createdAt: u.createdAt.toISOString(),
});

const unauth = () =>
  new GraphQLError('No autenticado', { extensions: { code: 'UNAUTHENTICATED' } });

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, { userId }: Context) => {
      if (!userId) throw unauth();
      const user = await User.findById(userId);
      return user ? toGql(user) : null;
    },
  },
  Mutation: {
    login: async (_: unknown, args: { username: string; password: string }) => {
      const user = await User.findOne({ username: args.username });
      const ok = user && (await bcrypt.compare(args.password, user.passwordHash));
      if (!user || !ok) throw new GraphQLError('Credenciales inválidas');
      return { token: signToken(user.id), user: toGql(user) };
    },
    updateUser: async (
      _: unknown,
      { input }: { input: { name?: string; lastName?: string; email?: string } },
      { userId }: Context
    ) => {
      if (!userId) throw unauth();
      const user = await User.findByIdAndUpdate(userId, input, { new: true });
      if (!user) throw unauth();
      return toGql(user);
    },
  },
};
