import React, { useState, useEffect } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";

// Icons
import { BiLogOut, BiLogIn } from "react-icons/bi";
import { TbUsers, TbReportAnalytics, TbTrash } from "react-icons/tb";
import { LuFile } from "react-icons/lu";
import { PiBasket } from "react-icons/pi";
import { HiOutlineHome } from "react-icons/hi";
import { GiHamburgerMenu } from "react-icons/gi";
import { RxCross1 } from "react-icons/rx";
import { FiUser } from "react-icons/fi";
import { MdDiscount } from "react-icons/md";
import { BiLayout } from "react-icons/bi";

import logo from "../../Assets/logo/jass_logo_new.png";
import "./Navbar.css";

const Navbar = ({
  children,
  onNavigation,
  isCollapsed = false,
  onToggleCollapse,
  pageDashboard = null,
}) => {
  const [toggle, setToggle] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  /* Sync collapsed state */
  useEffect(() => {
    setToggle(isCollapsed);
  }, [isCollapsed]);

  const handleToggle = (state) => {
    setToggle(state);
    if (onToggleCollapse) onToggleCollapse(state);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = () => navigate("/login");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/members":
        return "Members Dashboard";
    
      case "/dashboard":
        return "Dashboard";
      case "/report":
        return "Business Reports And Analytics";
      case "/":
        return "Dashboard";
      case "/maintenance":
        return "Maintenance Management";
      default:
        return "";
    }
  };

  const menuData = [
    // { icon: <PiBasket />, title: "Invoice", path: "/" }, 
    { icon: <HiOutlineHome />, title: "Dashboard", path: "/dashboard" },
    { icon: <TbUsers />, title: "Members", path: "/members" },
    { icon: <LuFile />, title: "Retes", path: "/fixrates" },
    { icon: <LuFile />, title: "Maintenance", path: "/maintenance" },
    { icon: <BiLayout />, title: "Inventory", path: "/inventory" },
    { icon: <TbTrash />, title: "Product Disposal", path: "/defective" },
    { icon: <MdDiscount />, title: "Discount", path: "/productdiscount" },
    { icon: <TbReportAnalytics />, title: "Report", path: "/report" },
    { icon: <TbUsers />, title: "Admin", path: "/admin" },
  ];

  return (
    <>
      {/* SIDEBAR */}
      <div id="sidebar" className={toggle ? "hide" : ""}>
        <div className="logo">
          <div className="logoBox">
            {toggle ? (
              <GiHamburgerMenu
                className="menuIconHidden"
                onClick={() => handleToggle(false)}
              />
            ) : (
              <>
                <img src={logo} alt="Logo" className="sidebar-logo" />
                <RxCross1
                  className="menuIconHidden"
                  onClick={() => handleToggle(true)}
                />
              </>
            )}
          </div>
        </div>

        <ul className="side-menu top">
          {menuData.map(({ icon, title, path }, i) => (
            <li key={i}>
              <NavLink
                to={path}
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={(e) => {
                  if (onNavigation) {
                    e.preventDefault();
                    onNavigation(path);
                  }
                }}
              >
                <span className="menu-icon">{icon}</span>
                <span className="menu-title">{title}</span>
              </NavLink>
            </li>
          ))}

          {isLoggedIn && (
            <li className="logout-menu-item">
              <button className="sidebar-logout-btn" onClick={handleLogout}>
                <BiLogOut />
                <span>Logout</span>
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* CONTENT */}
      <div id="content">
        <nav>
          <div className="nav-main">
            <GiHamburgerMenu
              className="menuIcon"
              onClick={() => handleToggle(!toggle)}
            />

            {getPageTitle() && (
              <div className="page-title">{getPageTitle()}</div>
            )}
          </div>

          <div>
            {!isLoggedIn ? (
              <button className="icon-button" onClick={handleLogin}>
                <BiLogIn />
              </button>
            ) : (
              <div className="profile">
                <div className="profile-icon">
                  <FiUser />
                </div>
                <button className="icon-button" onClick={handleLogout}>
                  <BiLogOut />
                </button>
              </div>
            )}
          </div>
        </nav>

        {children}
      </div>
    </>
  );
};

export default Navbar;
