export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-center mb-8">
          Registration Summary
        </h1>

        <div className="space-y-4">

          <div className="flex justify-between">
            <span>Profile Type</span>
            <span>Male</span>
          </div>

          <div className="flex justify-between">
            <span>Registration Fee</span>
            <span>₹799</span>
          </div>

          <div className="flex justify-between">
            <span>GST (18%)</span>
            <span>₹143.82</span>
          </div>

          <hr />

          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>₹942.82</span>
          </div>

        </div>

        <button className="mt-8 w-full bg-red-700 text-white py-3 rounded-xl">
          Proceed To Payment
        </button>

      </div>
    </div>
  );
}