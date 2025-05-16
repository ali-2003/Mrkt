export const contact = {
    name: "contact",
    title: "Misc - Contact",
    type: "document",
    fields: [
      {
        name: "bannerImage",
        title: "Banner Image",
        type: "image",
        validation: (Rule) => Rule.required(),
      },
      {
        name: "contactDescription",
        title: "Contact Description",
        type: "blockContent",
        validation: (Rule) => Rule.required(),
      },
      
    ],
  };
  