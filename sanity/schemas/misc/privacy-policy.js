export const privacyPolicy = {
  name: "privacyPolicy",
  title: "Misc - Privacy Policy",
  type: "document",
  fields: [
    {
      name: "privacyPolicyText",
      title: "Privacy Policy Text",
      type: "blockContent",
      validation: (Rule) => Rule.required(),
    },
  ],
};
