"use client";

import React, { useState } from "react";

const initialState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const ContactForm = () => {
  const [formData, setFormData] = useState(initialState);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [id]: value,
    }));
  };

  // Event handler for form submission (optional)
  const handleSubmit = async () => {
    await sanityAdminClient.create({
      _type: "contactQuestions",
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message,
    });
    setFormData(initialState);
  };
  
  return (
    <form className="contact-form mb-3">
      <div className="row">
        <div className="col-sm-6">
          <label htmlFor="name" className="sr-only">
            Nama
          </label>
          <input type="text" className="form-control" id="name" placeholder="Nama *" required value={formData.name} onChange={handleChange} />
        </div>

        <div className="col-sm-6">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input type="email" className="form-control" id="email" placeholder="Email *" required value={formData.email} onChange={handleChange} />
        </div>
      </div>

      <div className="row">
        <div className="col-sm-6">
          <label htmlFor="phone" className="sr-only">
            Nomor WhatsApp
          </label>
          <input type="tel" className="form-control" id="phone" placeholder="Nomor WhatsApp" value={formData.phone} onChange={handleChange} />
        </div>

        <div className="col-sm-6">
          <label htmlFor="subject" className="sr-only">
            Subjek
          </label>
          <input type="text" className="form-control" id="subject" placeholder="Subjek" value={formData.subject} onChange={handleChange} />
        </div>
      </div>

      <label htmlFor="message" className="sr-only">
        Pesan
      </label>
      <textarea className="form-control" cols="30" rows="4" id="message" required placeholder="Pesan *" value={formData.message} onChange={handleChange}></textarea>

      <button type="button" className="btn btn-outline-primary-2 btn-minwidth-sm" onClick={handleSubmit}>
        <span>SUBMIT</span>
        <i className="icon-long-arrow-right"></i>
      </button>
    </form>
  );
};

export default ContactForm;
