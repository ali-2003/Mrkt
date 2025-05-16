import { category } from "./schemas/blog/category";
import { post } from "./schemas/blog/post";
import { author } from "./schemas/blog/author";

import { order } from "./schemas/ecom/order";
import { product } from "./schemas/ecom/product";
import { discount } from "./schemas/ecom/discount";

import { faq } from "./schemas/misc/faq";
import { home } from "./schemas/misc/home";
import { about } from "./schemas/misc/about";
import { contact } from "./schemas/misc/contact";
import { privacyPolicy } from "./schemas/misc/privacy-policy";
import { termsCondition } from "./schemas/misc/terms-condition";
import { contactQuestions } from "./schemas/misc/contactQuestions";

import { blockContent } from "./schemas/blockContent";

import { user } from "./schemas/auth/user";
import { business } from "./schemas/auth/business";
import { account } from "./schemas/auth/account";
import { verificationToken } from "./schemas/auth/verification-token";
import { referral } from "./schemas/auth/referral";
// import { user, account, verificationToken } from 'next-auth-sanity/schemas';


export const schema = {
  types: [product, discount, order, post, author, category, home, about, faq, contact, termsCondition, privacyPolicy, blockContent, contactQuestions, user, referral, account, verificationToken],
};
