import React, { useState, useCallback } from "react";
import {
  HeaderContainer,
  Header,
  SkipToContent,
  HeaderName,
  HeaderGlobalBar,
} from "@carbon/react";
import AuthModal from "./AuthModal";
import { tokenAuth } from "../services/tokenAuth";
import { Nav } from "./Nav";
import { UserMenu } from "./UserMenu";

export default function AppHeader({ currentPath }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isLogged, isAdmin, validateToken } = tokenAuth();

  const openLoginModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(async () => {
    setIsAuthModalOpen(false);
    await validateToken();
  }, [validateToken]);

  return (
    <>
      <AuthModal open={isAuthModalOpen} onClose={closeLoginModal} />

      <HeaderContainer
        render={() => (
          <Header aria-label="Stock Control">
            <SkipToContent />

            <HeaderName href="/" prefix="">
              StockControl
            </HeaderName>

            <Nav isAdmin={isAdmin} currentPath={currentPath} />

            <HeaderGlobalBar>
              <UserMenu
                isLogged={isLogged}
                validateToken={validateToken}
                onOpenLoginModal={openLoginModal}
              />
            </HeaderGlobalBar>
          </Header>
        )}
      />
    </>
  );
}
