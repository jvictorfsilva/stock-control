import React, { useState, useCallback } from "react";
import {
  HeaderContainer,
  Header,
  SkipToContent,
  HeaderName,
  HeaderGlobalBar,
} from "@carbon/react";
import AuthModal from "./AuthModal";
import ChangeRoleModal from "./AdminModal";
import { tokenAuth } from "../services/tokenAuth";
import { Nav } from "./Nav";
import { UserMenu } from "./UserMenu";

export default function AppHeader({ currentPath }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChangeRoleOpen, setIsChangeRoleOpen] = useState(false);
  const { isLogged, isAdmin, validateToken } = tokenAuth();

  const openLoginModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(async () => {
    setIsAuthModalOpen(false);
    await validateToken();
  }, [validateToken]);

  const openChangeRole = () => setIsChangeRoleOpen(true);
  const closeChangeRole = () => setIsChangeRoleOpen(false);

  const handleRoleSuccess = () => {};

  return (
    <>
      <AuthModal open={isAuthModalOpen} onClose={closeLoginModal} />
      {isAdmin && (
        <ChangeRoleModal
          open={isChangeRoleOpen}
          onClose={closeChangeRole}
          onSuccess={handleRoleSuccess}
          showNotification={() => {}}
          setNotificationKind={() => {}}
          setNotificationTitle={() => {}}
          setNotificationSubtitle={() => {}}
        />
      )}

      <HeaderContainer
        render={() => (
          <Header aria-label="Stock Control">
            <SkipToContent />
            <HeaderName href="/" prefix="">
              StockControl
            </HeaderName>

            <Nav
              isAdmin={isAdmin}
              currentPath={currentPath}
              onAdminClick={openChangeRole}
            />

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
