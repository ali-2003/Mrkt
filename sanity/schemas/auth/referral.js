export const referral = {
  name: 'referral',
  title: 'Auth - Referral',
  type: 'document',
  fields: [
    {
      name: 'referralEmail',
      title: 'Referral Email',
      description: 'The email of the user who referred the other user.',
      type: 'string',
    },
    {
      name: 'referredEmail',
      title: 'Referred Email',
      description: 'The email of the user who was referred.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: "referralCode",
      title: "Referral Code",
      description: "The referral code of the user who was referred.",
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: "referAvailed",
      title: "Refer Availed",
      description: "The refer availed of the user who was referred.",
      type: 'boolean',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'dateOfReferral',
      title: 'Date of Referral',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
  ],
};
