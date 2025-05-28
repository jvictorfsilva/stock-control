import React from "react";
import { HeaderNavigation, HeaderMenuItem } from "@carbon/react";

export function Nav({ isAdmin, currentPath, onAdminClick }) {
  return (
    <HeaderNavigation aria-label="Main Navigation">
      <HeaderMenuItem
        href="/"
        aria-current={currentPath === "/" ? "page" : undefined}
      >
        Items
      </HeaderMenuItem>
      <HeaderMenuItem
        href="/categories"
        aria-current={currentPath === "/categories" ? "page" : undefined}
      >
        Categories
      </HeaderMenuItem>
      {isAdmin && (
        <HeaderMenuItem
          onClick={onAdminClick}
          aria-current={currentPath === "/admin" ? "page" : undefined}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === " ") onAdminClick();
          }}
        >
          Admin
        </HeaderMenuItem>
      )}
    </HeaderNavigation>
  );
}
