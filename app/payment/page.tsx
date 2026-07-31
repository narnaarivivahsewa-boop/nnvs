export default function PaymentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">

      <div className="bg-white p-10 rounded-2xl shadow-xl text-center">

        <h1 className="text-3xl font-bold mb-6">
          Payment
        </h1>

        <button className="bg-green-600 text-white px-8 py-3 rounded-xl">
          Pay with Razorpay
        </button>

      </div>

    </div>
  );
}