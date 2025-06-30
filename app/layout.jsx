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
  src: "../public/fonts/noir.woff2"
})

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
    <html lang="en" className={avenirFont.className}>
      <body>
        <ReduxProvider>
          <Layout>{children}</Layout>
        </ReduxProvider>
        
        <Script src="/js/jquery.min.js" />
        
        {/* SendinBlue Script */}
        <Script id="show-banner">
          {`(function() {
            window.sib = {
              equeue: [],
              client_key: "y6x68j09m2g6n2tlov9iucnz"
            };
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

        {/* Abandonment Email System */}
        <Script id="abandonment-email-system">
          {`
            class AbandonmentEmailSystem {
              constructor() {
                this.userEmail = null;
                this.hasItemsInCart = false;
                this.hasPurchased = false;
                this.sessionStartTime = Date.now();
                this.emailSent = false;
                
                this.init();
              }
              
              init() {
                // Track when user leaves the website
                window.addEventListener('beforeunload', (e) => {
                  this.handleUserLeaving();
                });
                
                // Backup: Track when tab loses focus (user switching tabs/closing)
                document.addEventListener('visibilitychange', () => {
                  if (document.hidden && !this.emailSent) {
                    // Small delay to avoid triggering on quick tab switches
                    setTimeout(() => {
                      if (document.hidden) {
                        this.handleUserLeaving();
                      }
                    }, 3000);
                  }
                });
              }
              
              // Call this when user provides email (signup, starts checkout, etc.)
              setUserEmail(email) {
                this.userEmail = email;
                console.log('Email captured for abandonment tracking:', email);
              }
              
              // Call this when items are added/removed from cart
              updateCartStatus(hasItems) {
                this.hasItemsInCart = hasItems;
                console.log('Cart status updated:', hasItems ? 'Has items' : 'Empty');
              }
              
              // Call this when purchase is completed
              markPurchaseComplete() {
                this.hasPurchased = true;
                this.emailSent = true; // Prevent any abandonment emails
                console.log('Purchase completed - abandonment emails disabled');
              }
              
              // Main logic for handling user departure
              handleUserLeaving() {
                // Don't send email if already sent or if user purchased
                if (this.emailSent || this.hasPurchased || !this.userEmail) {
                  return;
                }
                
                // Determine which email template to use
                const emailType = this.hasItemsInCart ? 'cart_abandonment' : 'website_abandonment';
                
                // Send the email
                this.sendAbandonmentEmail(emailType);
                this.emailSent = true;
              }
              
              // Send email via your backend API
              async sendAbandonmentEmail(emailType) {
                try {
                  const emailData = {
                    email: this.userEmail,
                    type: emailType,
                    cartItems: this.hasItemsInCart ? this.getCartItems() : null,
                    sessionDuration: Date.now() - this.sessionStartTime,
                    timestamp: new Date().toISOString()
                  };
                  
                  // Call your backend API
                  await fetch('/api/send-abandonment-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailData)
                  });
                  
                  console.log(\`\${emailType} email sent to \${this.userEmail}\`);
                } catch (error) {
                  console.error('Failed to send abandonment email:', error);
                }
              }
              
              // Get current cart items from Redux store (if available)
              getCartItems() {
                try {
                  // Try to get from Redux store if available
                  if (window.__NEXT_REDUX_STORE__ && window.__NEXT_REDUX_STORE__.getState) {
                    const state = window.__NEXT_REDUX_STORE__.getState();
                    return state.cart?.items || [];
                  }
                  
                  // Fallback: try localStorage
                  return JSON.parse(localStorage.getItem('cart') || '[]');
                } catch (error) {
                  console.error('Error getting cart items:', error);
                  return [];
                }
              }
            }

            // Initialize the system when DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', function() {
                window.abandonmentSystem = new AbandonmentEmailSystem();
              });
            } else {
              window.abandonmentSystem = new AbandonmentEmailSystem();
            }
          `}
        </Script>

        <GoogleAnalytics gaId="G-ZK0F60HHVF" />
      </body>
    </html>
  );
}