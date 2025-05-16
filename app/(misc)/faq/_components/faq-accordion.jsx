"use client";

import { PortableText } from "@portabletext/react";

import Card from "@/components/features/accordion/card";
import Accordion from "@/components/features/accordion/accordion";
import { RichTextComponents } from "@/components/features/rich-text-component";

const FaqAccordion = ({ data }) => {
  return (
    <div className="container">
      <h2 className="title text-center mb-3 capitalize">{data.sectionName}</h2>

      <Accordion adClass="accordion-rounded">
        {data?.questions
          ?.sort((a, b) => a.order - b.order)
          ?.map((item, index) => (
            <Card
              key={index}
              title={item?.question}
              adClass="card-box card-sm bg-light"
            >
              <PortableText
                value={item?.answer}
                components={RichTextComponents}
              />
            </Card>
          ))}
      </Accordion>
    </div>
  );
};

export default FaqAccordion;
