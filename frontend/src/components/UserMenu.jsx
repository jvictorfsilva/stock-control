import React, { useState, useCallback } from "react";
import Cookies from "js-cookie";
import {
  OverflowMenu,
  OverflowMenuItem,
  HeaderGlobalAction,
} from "@carbon/react";
import { User as UserAvatar } from "@carbon/icons-react";

export function UserMenu({ isLogged, validateToken, onOpenLoginModal }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleIconClick = useCallback(async () => {
    const valid = await validateToken();
    if (valid) {
      setMenuOpen(true);
    } else {
      onOpenLoginModal();
    }
  }, [validateToken, onOpenLoginModal]);

  const handleLogout = useCallback(() => {
    Cookies.remove("userToken");
    validateToken();
    setMenuOpen(false);
  }, [validateToken]);

  if (!isLogged) {
    return (
      <HeaderGlobalAction aria-label="User profile" onClick={handleIconClick}>
        <UserAvatar />
      </HeaderGlobalAction>
    );
  }

  return (
    <OverflowMenu
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      renderIcon={UserAvatar}
      iconDescription="User menu"
      light
      direction="bottom"
      menuOffset={{ left: -56 }}
      size="lg"
      onClick={handleIconClick}
    >
      <OverflowMenuItem itemText="Log out" onClick={handleLogout} />
    </OverflowMenu>
  );
}
