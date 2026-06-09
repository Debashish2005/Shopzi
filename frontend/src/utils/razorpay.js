const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let checkoutScriptPromise;

export function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (!checkoutScriptPromise) {
    checkoutScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${RAZORPAY_CHECKOUT_URL}"]`
      );

      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Unable to load Razorpay Checkout.")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.src = RAZORPAY_CHECKOUT_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
      document.body.appendChild(script);
    });
  }

  return checkoutScriptPromise;
}

export async function openRazorpayCheckout(options) {
  await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      callback(value);
    };

    const checkout = new window.Razorpay({
      ...options,
      handler: (response) => finish(resolve, response),
      modal: {
        confirm_close: true,
        ...options.modal,
        ondismiss: () => {
          const error = new Error("Payment window closed.");
          error.code = "CHECKOUT_CLOSED";
          finish(reject, error);
        },
      },
      retry: {
        enabled: false,
      },
    });

    checkout.on("payment.failed", (response) => {
      const error = new Error(
        response?.error?.description || "The test payment was not completed."
      );
      error.code = "PAYMENT_FAILED";
      error.details = response?.error;
      finish(reject, error);
    });

    checkout.open();
  });
}
