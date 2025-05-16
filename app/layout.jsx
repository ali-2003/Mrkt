import Script from "next/script";
import { Jost, Manrope } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'

import "./globals.css";

import "@/public/css/bootstrap.min.css";
import "@/public/css/fonts-molla.min.css";
import "@/public/vendor/line-awesome/css/line-awesome.min.css";
import "@/public/scss/plugins/owl-carousel/owl.carousel.scss";

import "@/public/scss/style.scss";

import Layout from "@/components/custom-layout";
import { ReduxProvider } from "@/redux/provider";
import localFont from "next/font/local"

const avenirFont = localFont({
  // src: "../public/fonts/avenir.woff2"
  src: "../public/fonts/noir.woff2"
})

// export const metadata = {
//   title: {
//     template: "%s | mrkt.",
//     default: "mrkt.",
//   },
//   description: "Rasa riang hanya dari mrkt.",
// };

const jost = Jost({
  subsets: ["latin-ext"],
  variable: "font-family",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin-ext"],
  variable: "second-font-family",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    // <html lang="en" className={`${jost.variable} ${manrope.variable}`}>
    <html lang="en" className={avenirFont.className}>
      <body>
        <ReduxProvider>
          <Layout>{children}</Layout>
        </ReduxProvider>

        <Script src="/js/jquery.min.js" />
        <Script id="show-banner">
          {`(function() {
        window.sib = {
            equeue: [],
            client_key: "y6x68j09m2g6n2tlov9iucnz"
        };
        /* OPTIONAL: email for identify request*/
        // window.sib.email_id = 'example@domain.com';
        window.sendinblue = {};
        for (var j = ['track', 'identify', 'trackLink', 'page'], i = 0; i < j.length; i++) {
        (function(k) {
            window.sendinblue[k] = function() {
                var arg = Array.prototype.slice.call(arguments);
                (window.sib[k] || function() {
                        var t = {};
                        t[k] = arg;
                        window.sib.equeue.push(t);
                    })(arg[0], arg[1], arg[2]);
                };
            })(j[i]);
        }
        var n = document.createElement("script"),
            i = document.getElementsByTagName("script")[0];
            n.type = "text/javascript", n.id = "sendinblue-js",
            n.async = !0, n.src = "https://sibautomation.com/sa.js?key="+ window.sib.client_key,
            i.parentNode.insertBefore(n, i), window.sendinblue.page();
    })();`}
        </Script>
      </body>
      {/* <GoogleAnalytics gaId="GTM-NZVHDSM7" /> */}
      <GoogleAnalytics gaId="G-ZK0F60HHVF" />
    </html>
  );
}
