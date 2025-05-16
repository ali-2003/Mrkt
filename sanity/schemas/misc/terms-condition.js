export const termsCondition = {
  name: "termsCondition",
  title: "Misc - Terms & Conditions",
  type: "document",
  fields: [
    {
      name: "termsConditionText",
      title: "Terms & Conditions Text",
      type: "blockContent",
      validation: (Rule) => Rule.required(),
    },
  ],
};
