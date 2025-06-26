import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './pages/signup';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Profilepage from './pages/profilepage'
import ManageAddresses from './pages/ManageAddresses';
import LoadingScreen from './pages/LoadingScreen';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import PlaceOrderPage from './pages/PlaceOrderPage';
import CartCheckoutPage from './pages/CartCheckoutPage';
import OrdersPage from "./pages/OrdersPage";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SearchResults from './pages/SearchResults';
function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path='/' element = {<LoadingScreen/>}/>
        <Route path = "/signup" element = {<Signup/>}/>
        <Route path= "/login" element = {<Login/>}/>
        <Route path='/dashboard' element = {<Dashboard/>}/>
        <Route path='/profile' element = {<Profilepage/>}/>
        <Route path='/manage-address' element = {<ManageAddresses/>}/>
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/place-order" element={<PlaceOrderPage/>}/>
        <Route path="/cart-checkout" element={<CartCheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </Router>
  )
}

export default App;
