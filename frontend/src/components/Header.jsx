import React, { useState } from "react";
import Cookies from "js-cookie";
import {
  HeaderContainer,
  Header,
  SkipToContent,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  OverflowMenu,
  OverflowMenuItem,
} from "@carbon/react";
import { User as UserAvatar } from "@carbon/icons-react";
import AuthModal from "./AuthModal";
import auth from "../services/auth";

const AppHeader = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(!!Cookies.get("userToken"));
  const [menuOpen, setMenuOpen] = useState(false);

  const handleUserIconClick = async () => {
    const token = Cookies.get("userToken");
    if (!token) {
      setIsLogged(false);
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await auth.get("/validate-token", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsLogged(true);
      setMenuOpen(true);
    } catch (err) {
      Cookies.remove("userToken");
      setIsLogged(false);
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    Cookies.remove("userToken");
    setIsLogged(false);
    setMenuOpen(false);
  };

  const handleModalClose = () => {
    setIsAuthModalOpen(false);
    if (Cookies.get("userToken")) {
      setIsLogged(true);
    }
  };

  return (
    <>
      <AuthModal open={isAuthModalOpen} onClose={handleModalClose} />

      <HeaderContainer
        render={() => (
          <Header aria-label="Stock Control">
            <SkipToContent />

            <HeaderName href="#" prefix="">
              StockControl
            </HeaderName>

            <HeaderGlobalBar>
              {isLogged ? (
                <OverflowMenu
                  open={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  renderIcon={UserAvatar}
                  iconDescription="User menu"
                  light
                  direction="bottom"
                  menuOffset={{ left: -56 }}
                  size="lg"
                  onClick={handleUserIconClick}
                >
                  <OverflowMenuItem itemText="Log out" onClick={handleLogout} />
                </OverflowMenu>
              ) : (
                <HeaderGlobalAction
                  aria-label="User profile"
                  onClick={handleUserIconClick}
                >
                  <UserAvatar />
                </HeaderGlobalAction>
              )}
            </HeaderGlobalBar>
          </Header>
        )}
      />
    </>
  );
};

export default AppHeader;
