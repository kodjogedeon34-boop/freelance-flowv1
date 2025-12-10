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
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Update refs to avoid re-triggering effect when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check if SDK is loaded
    if (!window.paypal || !window.paypal.Buttons) {
        console.error("PayPal SDK not loaded or unavailable");
        onErrorRef.current();
        return;
    }

    // Explicitly clear container to prevent duplication or dirty state
    container.innerHTML = "";

    let isCancelled = false;
    let buttonsInstance: any = null;

    const renderButtons = async () => {
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
                    if (isCancelled) return;
                    try {
                        await actions.order.capture();
                        onSuccessRef.current();
                    } catch (error) {
                        console.error("PayPal Capture Error:", error);
                        onErrorRef.current();
                    }
                },
                onError: (err: any) => {
                    if (isCancelled) return;
                    console.error("PayPal SDK Error:", err);
                    // Do not immediately trigger global error to avoid render loops on soft errors
                }
            });

            if (buttonsInstance.isEligible() && !isCancelled && container) {
                // Double check container existence and emptiness before rendering
                if (container.children.length === 0) {
                     await buttonsInstance.render(container);
                }
            }
        } catch (error) {
            console.error("PayPal Button Render Error:", error);
        }
    };

    renderButtons();

    return () => {
        isCancelled = true;
        if (buttonsInstance) {
            try {
                buttonsInstance.close().catch(() => {});
            } catch (e) {
                // Ignore errors during closure
            }
        }
        if (container) {
            container.innerHTML = "";
        }
    };
  }, [amount, description]);

  return <div ref={containerRef} className="w-full relative z-0" style={{ minHeight: '150px' }} />;
};
