import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "../Pages/Home/Home";
import Customer from "../Pages/Customer/Customer";
import Vendor from "../Pages/Vendor/Vendor";
import Items from "../Pages/Items/Items";
import PurchaseOrder from "../Pages/PurchaseOrder/PurchaseOrder";
import GRN from "../Pages/GRN/GRN";
import Bom from "../Pages/Bom/Bom";
import Sales from "../Pages/Sales/Sales";
import Inventory from "../Pages/Inventory/Inventory";

import Register from "../Pages/Authentication/Register/Register";
import Login from "../Pages/Authentication/Login/Login";
import ProtectedRoute from "../Components/Protected/ProtectedRoute";

import ProductDisposal from "../Pages/Defective/ProductDisposal";
import AdminUsers from "../Pages/Authentication/Admin/AdminUsers";
import DiscountProduct from "../Pages/DiscountProduct/DiscountProduct";
import Report from "../Pages/Reports/Report";
import Members from "../Pages/Members/Members";

import Footer from "../Components/Footer/Footer";
import FixRates from "../Pages/FixRates/FixRates";
import Maintenance from "../Pages/Maintenance/Maintenance";

const Router = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <div style={{ flex: 1 }}>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/members" element={<Members />} />
          <Route path="/fixrates" element={<FixRates />} />
          <Route path="/maintenance" element={<Maintenance />} />

          {/* PROTECTED ROUTES (LOGIN REQUIRED ONLY) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer"
            element={
              <ProtectedRoute>
                <Customer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendor"
            element={
              <ProtectedRoute>
                <Vendor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/items"
            element={
              <ProtectedRoute>
                <Items />
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchase-order"
            element={
              <ProtectedRoute>
                <PurchaseOrder />
              </ProtectedRoute>
            }
          />

          <Route
            path="/grn"
            element={
              <ProtectedRoute>
                <GRN />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bom"
            element={
              <ProtectedRoute>
                <Bom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sales"
            element={
              <ProtectedRoute>
                <Sales />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/defective"
            element={
              <ProtectedRoute>
                <ProductDisposal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/productdiscount"
            element={
              <ProtectedRoute>
                <DiscountProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      <Footer />
    </div>
  );
};

export default Router;
