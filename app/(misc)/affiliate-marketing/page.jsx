"use client"

import React, { useEffect, useState } from 'react'
import AffiliateComponent from './_components'
import { client } from '@/sanity/lib/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const AffiliatePage = () => {
  const [discount, setDiscount] = useState(null);
  const [fetching, setFetching] = useState(true);

  const router = useRouter()
  const { data: session } = useSession();
  console.log("🚀 ~ AffiliatePage ~ session:", session)

  if (session === null) {
    router.push('/')
  }

  const fetchDiscount = async (email) => {
    setFetching(true);
    try {
      const res = await client.fetch(`*[_type == 'discount' && type == 'affiliate' && email == $email]{
        ...
      }`, { email });

      if (!res || res.length === 0) {
        router.push('/');
      }
      
      setDiscount(res[0]);
    } catch (err) {
      console.log(err);
      router.push('/');
    } finally {
      setFetching(false);
    }
  };
  

  useEffect(() => {
    if (session?.user?.type === 'business') {
      router.push('/')
    }

    console.log(session, fetching)
    if (session) {
      fetchDiscount(session?.user?.email)
    }

  }, [session?.user?.email]);

  if (fetching) {
    return null
  }

  return <AffiliateComponent balance={session?.user?.balance} discount={discount} />
}

export default AffiliatePage