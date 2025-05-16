'use client'

import Link from 'next/link.js';
import { useSearchParams } from 'next/navigation'
import React from 'react'
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

export const dynamic = 'force-dynamic'

const SuccessPage = () => {
  const dispatch = useDispatch();

  const getOrderDetails = async (sessionId) => {
    try {
      const url = `/api/getSession?sessionId=${sessionId}`
      const res = await fetch(url);
      
      if (!res.ok) {
        toast.error('Error getting order details. Although, your order has been placed. Contact support for more info.');
        return;
      }
    
      const data = await res.json();
    } catch (err) {
      toast.error(err.message);
    } finally {
    //   dispatch(emptyCart());
    }
  };

  const params = useSearchParams()
  const sessionId = params.get('sessionId')

  getOrderDetails(sessionId)


  return (
    <div className='w-full min-h-[50vh] flex items-center justify-center flex-col'>
      <h2>Congratulations, Your order has been placed!</h2>
      <Link href='/ejuice'>Continue Chopping</Link>
    </div>
  )
}

export default SuccessPage