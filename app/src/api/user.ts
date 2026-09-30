import { gql } from '@apollo/client';

export const ME = gql`
  query Me {
    me {
      id
      username
      name
      lastName
      email
      userType
      createdAt
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      name
      lastName
      email
    }
  }
`;

export interface MeData {
  me: {
    id: string;
    username: string;
    name: string;
    lastName: string;
    email: string;
    userType: string;
    createdAt: string;
  };
}