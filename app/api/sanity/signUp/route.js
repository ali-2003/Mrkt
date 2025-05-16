import { signUpHandler } from 'next-auth-sanity';
import { client, sanityAdminClient } from '@/sanity/lib/client';

// const handler = signUpHandler(client);

// export { handler as POST };

// export const POST = () => {
    
//         console.log('nigga')
//         try {
//             return signUpHandler(client)
//         } catch (err) {
//             console.log('err')
//         }

//     }
export const POST = signUpHandler(sanityAdminClient);