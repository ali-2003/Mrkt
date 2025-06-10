// app/payment/failed/page.js
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { client } from "@/sanity/lib/client";

function PaymentFailurePage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    console.log("Payment failure page loaded");
    console.log("Order ID from URL:", orderId);
    
    if (orderId) {
      fetchOrder();
    } else {
      console.error("No order ID in URL");
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      console.log("Fetching order details for:", orderId);
      const orderData = await client.fetch(
        `*[_type == 'order' && _id == $orderId][0]{
          ...,
          "itemCount": count(products)
        }`,
        { orderId }
      );
      console.log("Order data fetched:", orderData);
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleRetryPayment = () => {
    // Redirect back to checkout with the same order
    if (order?.xenditInvoiceUrl) {
      window.location.href = order.xenditInvoiceUrl;
    } else {
      // Fallback to cart
      window.location.href = '/keranjang';
    }
  };

  if (loading) {
    return (
      <div className="main">
        <div className="page-content">
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-3">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="main">
        <div className="page-content">
          <div className="container">
            <div className="text-center py-5">
              <h1 className="text-danger">Invalid Payment Link</h1>
              <p>No order ID found in the URL.</p>
              <Link href="/" className="btn btn-primary">
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="page-content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="text-center py-5">
                {/* Failure Icon */}
                <div className="mb-4">
                  <div 
                    className="failure-icon mx-auto"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: '#dc3545',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '2rem'
                    }}
                  >
                    ✕
                  </div>
                </div>

                <h1 className="text-danger mb-3">Payment Failed</h1>
                <p className="text-muted mb-4">
                  Unfortunately, your payment could not be processed. Please try again or contact support if the issue persists.
                </p>

                {order && (
                  <div className="order-details bg-light p-4 rounded mb-4">
                    <h4 className="mb-3">Order Details</h4>
                    <div className="row text-left">
                      <div className="col-sm-6">
                        <strong>Order ID:</strong><br />
                        <span className="text-muted">#{order.orderId || order._id}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong>Order Date:</strong><br />
                        <span className="text-muted">
                          {new Date(order.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="col-sm-6 mt-3">
                        <strong>Items:</strong><br />
                        <span className="text-muted">{order.itemCount} item(s)</span>
                      </div>
                      <div className="col-sm-6 mt-3">
                        <strong>Total Amount:</strong><br />
                        <span className="text-muted">Rp {formatPrice(order.totalPrice)}</span>
                      </div>
                      {order.failureReason && (
                        <div className="col-12 mt-3">
                          <strong>Failure Reason:</strong><br />
                          <span className="text-danger">{order.failureReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!order && (
                  <div className="alert alert-warning">
                    <strong>Order not found</strong><br />
                    We couldn't find the order details. Please contact support with order ID: {orderId}
                  </div>
                )}

                <div className="alert alert-warning">
                  <strong>Don't worry!</strong><br />
                  Your order is still saved. You can retry the payment or try a different payment method.
                </div>

                <div className="mt-4">
                  {order?.xenditInvoiceUrl && order.status !== 'expired' && (
                    <button 
                      onClick={handleRetryPayment}
                      className="btn btn-primary mr-3"
                    >
                      Retry Payment
                    </button>
                  )}
                  <Link href="/keranjang" className="btn btn-outline-primary mr-3">
                    Back to Cart
                  </Link>
                  <Link href="/" className="btn btn-outline-secondary">
                    Continue Shopping
                  </Link>
                </div>

                <div className="mt-4">
                  <small className="text-muted">
                    Need help? <Link href="/contact" className="text-primary">Contact our support team</Link>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailurePage;