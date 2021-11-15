export const invalidLoginResponse = {
  errors: [
    {
      path: 'email',
      message: 'invalid login',
    },
  ],
};

export const userNotFoundResponse = {
  errors: [
    {
      path: 'user',
      message: 'user not found',
    },
  ],
};

export const notAuthenticatedResponse = {
  errors: [
    {
      path: 'user',
      message: 'not authenticated',
    },
  ],
};

export const tokensNotFound = {
  errors: [
    {
      path: 'user',
      message: 'no tokens found for this user',
    },
  ],
};
