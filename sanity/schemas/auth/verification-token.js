export const verificationToken = {
    name: 'verification-token',
    title: 'Auth - Verification Token',
    type: 'document',
    fields: [
      {
        name: 'identifier',
        title: 'Identifier',
        type: 'string'
      },
      {
        name: 'token',
        title: 'Token',
        type: 'string'
      },
      {
        name: 'expires',
        title: 'Expires',
        type: 'datetime'
      }
    ]
  };