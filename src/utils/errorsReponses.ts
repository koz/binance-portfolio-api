export const invalidLoginResponse = {
  errors: [
    {
      path: "email",
      message: "invalid login"
    }
  ]
};

export const userNotFoundResponse = {
  errors: [
    {
      path: "user",
      message: "user not found"
    }
  ]
}

export const notAuthenticatedResponse = {
  errors: [
    {
      path: "user",
      message: "not authenticated"
    }
  ]
}

export const walletNotFound = {
  errors: [
    {
      path: "user",
      message: "no wallet found for this user"
    }
  ]
}
