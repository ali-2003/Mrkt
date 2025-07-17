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
toast.error('Kesalahan mendapatkan detail pesanan. Meskipun demikian, pesanan Anda telah ditempatkan. Hubungi dukungan untuk informasi lebih lanjut.');
return;
 }
const data = await res.json();
 } catch (err) {
toast.error(err.message);
 } finally {
// dispatch(kosongkanKeranjang());
 }
 };
const params = useSearchParams()
const sessionId = params.get('sessionId')
getOrderDetails(sessionId)
return (
<div className='w-full min-h-[50vh] flex items-center justify-center flex-col'>
<h2>Selamat, pesanan Anda telah berhasil ditempatkan!</h2>
<Link href='/ejuice'>Lanjut Berbelanja</Link>
</div>
 )
}
export default SuccessPage