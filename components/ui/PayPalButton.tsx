
import React, { useEffect, useRef } from 'react';

// Make paypal available on the window object
declare global {
  interface Window {
    paypal: any;
  }
}

interface PayPalButtonProps {
  onSuccess: () => void;
  onError: () => void;
  amount: string;
  description: string;
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({ onSuccess, onError, amount, description }) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const isUnmounted = useRef(false);

  // Keep the refs updated with the latest callbacks to avoid re-triggering the effect
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);
  
  useEffect(() => {
    isUnmounted.current = false;
    const container = paypalRef.current;
    if (!container) return;

    // The PayPal SDK might not be loaded yet.
    if (!window.paypal || !window.paypal.Buttons) {
      console.error("PayPal SDK is not available.");
      // We can't render the button, so call the error handler
      if (!isUnmounted.current) onErrorRef.current();
      return;
    }

    // CRITICAL FIX: Clear the container before rendering to avoid "paypal_js_sdk_v5_unhandled_exception"
    // which happens if render is called on a non-empty container or due to React strict mode double-mounting.
    container.innerHTML = "";

    let buttonsInstance: any = null;
    
    try {
      buttonsInstance = window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        },
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              description: description,
              amount: {
                currency_code: 'EUR',
                value: amount
              }
            }]
          });
        },
        onApprove: async (_data: any, actions: any) => {
          if (isUnmounted.current) return;
          try {
            await actions.order.capture();
            onSuccessRef.current();
          } catch (error) {
            console.error("Failed to capture PayPal order:", error);
            onErrorRef.current();
          }
        },
        onError: (err: any) => {
          if (isUnmounted.current) return;
          console.error("PayPal SDK Error:", err);
          // Don't trigger global onErrorRef here immediately to avoid UI loops if it's a soft error
        }
      });
      
      if (buttonsInstance.isEligible()) {
        buttonsInstance.render(container).catch((err: any) => {
            console.error("Failed to render PayPal buttons", err);
        });
      }

    } catch (error) {
       console.error("Error initializing PayPal Buttons:", error);
    }

    // Cleanup function to run when the component unmounts or dependencies change.
    return () => {
      isUnmounted.current = true;
      if (buttonsInstance && typeof buttonsInstance.close === 'function') {
        try {
            buttonsInstance.close().catch((err: any) => console.log(err));
        } catch (e) {
            console.log(e);
        }
      }
      if (container) {
          container.innerHTML = "";
      }
    };
  // Re-run the effect if the purchase details change.
  }, [amount, description]);

  return <div ref={paypalRef} className="w-full z-0 relative" style={{ minHeight: '150px' }}></div>;
};
