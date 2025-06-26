// src/components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t text-sm text-gray-600">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Get to Know Us</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">About Us</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Press Releases</a></li>
              <li><a href="#" className="hover:underline">Shopzi Devices</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Connect with Us</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Facebook</a></li>
              <li><a href="#" className="hover:underline">Twitter</a></li>
              <li><a href="#" className="hover:underline">Instagram</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Make Money with Us</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Sell on Shopzi</a></li>
              <li><a href="#" className="hover:underline">Become an Affiliate</a></li>
              <li><a href="#" className="hover:underline">Advertise Your Products</a></li>
              <li><a href="#" className="hover:underline">Fulfilment Services</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Let Us Help You</h3>
            <ul className="space-y-1">
              <li><a href="#" className="hover:underline">Your Account</a></li>
              <li><a href="#" className="hover:underline">Returns Centre</a></li>
              <li><a href="#" className="hover:underline">Help</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-4 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Shopzi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
