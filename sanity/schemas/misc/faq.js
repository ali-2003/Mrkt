export const faq = {
  name: "faq", 
  title: "Misc - FAQ",
  type: "document",
  fields: [
    {
      name: "sectionName",
      title: "Section Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "questions",
      title: "Questions",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "question",
              title: "Question",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "answer",
              title: "Answer",
              type: "blockContent",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "order",
              title: "Arrangement Number",
              description:
                "Which order this question should appear in the list",
              type: "number",
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    },
  ],
};
